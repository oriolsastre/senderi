import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import type { PDFFont } from "pdf-lib";

const BG_COLOR = rgb(185 / 255, 203 / 255, 192 / 255);

function parseTranslate3d(style: string): { x: number; y: number } | null {
  const m = style.match(/translate3d\(([-\d.]+)px,\s*([-\d.]+)px/);
  return m ? { x: parseFloat(m[1]), y: parseFloat(m[2]) } : null;
}

function svgToPng(svgEl: SVGSVGElement): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      const str = new XMLSerializer().serializeToString(clone);
      const blob = new Blob([str], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const w = svgEl.clientWidth || parseInt(svgEl.getAttribute("width") || "600");
        const h = svgEl.clientHeight || parseInt(svgEl.getAttribute("height") || "150");
        const canvas = document.createElement("canvas");
        canvas.width = w * 2;
        canvas.height = h * 2;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w * 2, h * 2);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    } catch { resolve(null); }
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.src = src;
  });
}

async function waitForTilesStable(tilePane: HTMLElement, maxTotalMs = 15000): Promise<void> {
  const start = Date.now();
  let prevCount = -1;
  while (Date.now() - start < maxTotalMs) {
    const tiles = tilePane.querySelectorAll<HTMLImageElement>("img.leaflet-tile");
    const allLoaded = [...tiles].every(t => t.complete && t.naturalWidth > 0);
    const count = tiles.length;
    if (allLoaded && count === prevCount) return;
    prevCount = count;
    await new Promise(r => setTimeout(r, 200));
  }
  console.warn("[captureMap] tile stable wait timed out");
}

async function captureMapDirect(mapElement: HTMLElement): Promise<string | null> {
  try {
    const leafletEl = mapElement.querySelector(".leaflet-container") as HTMLElement;
    if (!leafletEl) return null;
    const mapW = leafletEl.clientWidth;
    const mapH = leafletEl.clientHeight;
    if (mapW === 0 || mapH === 0) return null;

    const canvas = document.createElement("canvas");
    canvas.width = mapW * 2;
    canvas.height = mapH * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, mapW, mapH);

    const mapPane = leafletEl.querySelector(".leaflet-map-pane") as HTMLElement;
    let mapOffsetX = 0, mapOffsetY = 0;
    if (mapPane) {
      const t = parseTranslate3d(mapPane.style.transform);
      if (t) { mapOffsetX = t.x; mapOffsetY = t.y; }
    }
    console.log(`[captureMap] mapPane offset: ${mapOffsetX}, ${mapOffsetY}, map size: ${mapW}x${mapH}`);

    // 1. Draw tiles
    const tilePane = leafletEl.querySelector(".leaflet-tile-pane") as HTMLElement;
    if (tilePane) {
      // Wait for all tiles to load and the set to stabilize (no new tiles added)
      await waitForTilesStable(tilePane);
      const tileImgs = tilePane.querySelectorAll<HTMLImageElement>("img.leaflet-tile");
      const promises: Promise<void>[] = [];
      for (const img of tileImgs) {
        if (!img.src || !img.complete || !img.naturalWidth) continue;
        const t = parseTranslate3d(img.style.transform);
        if (!t) continue;
        const x = t.x + mapOffsetX;
        const y = t.y + mapOffsetY;
        const w = img.naturalWidth || 256;
        const h = img.naturalHeight || 256;
        if (x + w < 0 || x > mapW || y + h < 0 || y > mapH) continue;
        if ("crossOrigin" in img && img.crossOrigin) {
          ctx.drawImage(img, x, y, w, h);
        } else {
          const p = fetchImageAsDataUrl(img.src).then(dataUrl => loadImage(dataUrl)).then(drawnImg => {
            ctx.drawImage(drawnImg, x, y, w, h);
          }).catch(() => { });
          promises.push(p);
        }
      }
      await Promise.all(promises);
    }

    // 2. Draw SVG overlay (GPX track paths)
    const overlayPane = leafletEl.querySelector(".leaflet-overlay-pane") as HTMLElement;
    if (overlayPane) {
      const svgs = overlayPane.querySelectorAll("svg");
      console.log(`[captureMap] overlayPane found, ${svgs.length} SVG(s)`);
      for (const svg of svgs) {
        console.log("[captureMap] SVG child tag:", svg.children[0]?.tagName);
        // Check for paths directly in the SVG or inside any <g>
        const paths = svg.querySelectorAll<SVGPathElement>("path");
        console.log(`[captureMap] ${paths.length} path(s) total in SVG`);
        // Try to find a <g> that might have a transform attribute (not CSS)
        const g = svg.querySelector<SVGGElement>("g");
        let gX = 0, gY = 0;
        if (g) {
          const cssT = g.style.transform;
          console.log("[captureMap] g CSS transform:", cssT, "SVG transform:", g.getAttribute("transform"));
          const t = parseTranslate3d(cssT);
          if (t) { gX = t.x; gY = t.y; }
        }
        console.log(`[captureMap] final translate: g(${gX},${gY}) + mapOffset(${mapOffsetX},${mapOffsetY})`);
        if (paths.length === 0) continue;
        ctx.save();
        ctx.translate(mapOffsetX + gX, mapOffsetY + gY);
        for (const path of paths) {
          const d = path.getAttribute("d");
          if (!d) continue;
          try {
            const p = new Path2D(d);
            ctx.strokeStyle = path.getAttribute("stroke") || "#9333ea";
            ctx.lineWidth = parseFloat(path.getAttribute("stroke-width") || "4");
            ctx.globalAlpha = parseFloat(path.getAttribute("stroke-opacity") || path.getAttribute("opacity") || "1");
            const fill = path.getAttribute("fill") || "none";
            if (fill !== "none") {
              ctx.fillStyle = fill;
              ctx.fill(p);
            }
            ctx.stroke(p);
          } catch (e) {
            console.error("[captureMap] Path2D error:", e);
          }
        }
        ctx.restore();
      }
    }

    // 3. Draw markers
    const markerPane = leafletEl.querySelector(".leaflet-marker-pane") as HTMLElement;
    if (markerPane) {
      // 3a. Image markers (start/finish from leaflet-gpx)
      // Leaflet positions via transform (point pixel) + negative margins (anchor offset)
      const markerImgs = markerPane.querySelectorAll<HTMLImageElement>("img.leaflet-marker-icon");
      console.log(`[captureMap] ${markerImgs.length} img marker(s)`);
      for (const img of markerImgs) {
        if (!img.src || !img.complete) { console.log("[captureMap] skip marker img, not ready"); continue; }
        const t = parseTranslate3d(img.style.transform);
        if (!t) { console.log("[captureMap] marker img, no translate3d match"); continue; }
        const ml = parseFloat(img.style.marginLeft) || 0;
        const mt = parseFloat(img.style.marginTop) || 0;
        const x = t.x + mapOffsetX + ml;
        const y = t.y + mapOffsetY + mt;
        const iw = img.width || img.naturalWidth || 33;
        const ih = img.height || img.naturalHeight || 45;
        console.log(`[captureMap] marker img pt=(${t.x},${t.y}) ml=${ml} mt=${mt} → draw at ${x},${y} size ${iw}x${ih}`);
        ctx.drawImage(img, x, y, iw, ih);
      }

      // 3b. DivIcon markers (waypoints) — drawn 1.5x for PDF
      const markerDivs = markerPane.querySelectorAll<HTMLDivElement>("div.leaflet-marker-icon");
      const WP_SCALE = 1.25;
      for (const div of markerDivs) {
        const t = parseTranslate3d(div.style.transform);
        if (!t) continue;
        const ml = parseFloat(div.style.marginLeft) || 0;
        const mt = parseFloat(div.style.marginTop) || 0;
        const x0 = t.x + mapOffsetX + ml;
        const y0 = t.y + mapOffsetY + mt;
        const w0 = div.offsetWidth || 24;
        const h0 = div.offsetHeight || 24;
        const w = w0 * WP_SCALE;
        const h = h0 * WP_SCALE;
        const x = x0 - (w - w0) / 2;
        const y = y0 - (h - h0) / 2;

        const innerSvg = div.querySelector("svg");
        if (!innerSvg) continue;

        const imageEl = innerSvg.querySelector("image");
        if (imageEl) {
          const href = imageEl.getAttribute("href") || imageEl.getAttribute("xlink:href");
          if (href) {
            try {
              const absUrl = new URL(href, window.location.href).href;
              const dataUrl = await fetchImageAsDataUrl(absUrl);
              const iconImg = await loadImage(dataUrl);
              ctx.drawImage(iconImg, x, y, w, h);
            } catch { }
          }
        } else {
          try {
            const clone = innerSvg.cloneNode(true) as SVGSVGElement;
            const svgStr = new XMLSerializer().serializeToString(clone);
            const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgStr)))}`;
            const img = await loadImage(dataUrl);
            ctx.drawImage(img, x, y, w, h);
          } catch { }
        }
      }
    }

    return canvas.toDataURL("image/png");
  } catch (err) {
    console.error("captureMapDirect error:", err);
    return null;
  }
}

async function fetchImageAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

interface INatObs {
  photoDataUrl: string;
  commonName?: string;
  scientificName?: string;
}

function capitalizeFirst(str?: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function truncateText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
  let t = text;
  while (t.length > 0 && font.widthOfTextAtSize(t + "…", fontSize) > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

async function fetchINatPhotos(userId: string, d1: string, d2: string): Promise<INatObs[]> {
  const params = new URLSearchParams({ user_id: userId, d1, d2, per_page: "200" });
  const res = await fetch(`/api/inaturalist/observations?${params}`);
  const data = await res.json();
  const results: INatObs[] = [];
  for (const obs of data.results || []) {
    if (obs.photos?.[0]?.url) {
      const url = obs.photos[0].url.replace("square.", "medium.");
      try {
        const photoDataUrl = await fetchImageAsDataUrl(url);
        results.push({
          photoDataUrl,
          commonName: obs.taxon?.preferred_common_name,
          scientificName: obs.taxon?.name,
        });
      } catch { /* skip */ }
    }
  }
  return results;
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.split('\n')) {
    const words = para.split(' ');
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

export interface GeneratePDFInput {
  title: string;
  statsText: string;
  description: string;
  waypoints: Array<{
    id: string;
    nom: string;
    descripcio: string;
    iconPngDataUrl: string | null;
  }>;
  mapElement: HTMLElement;
  chartElement: HTMLElement;
  inatParams?: {
    userId: string;
    dateInici: string;
    dateFinal: string;
  };
}

export async function generateInformePDF(input: GeneratePDFInput): Promise<Blob> {
  await new Promise(r => setTimeout(r, 400));

  const chartSvg = input.chartElement.querySelector("svg");
  const [mapImageUrl, chartImageUrl] = await Promise.all([
    captureMapDirect(input.mapElement),
    chartSvg ? svgToPng(chartSvg as SVGSVGElement) : Promise.resolve(null),
  ]);

  const waypointPngs = input.waypoints.map((wp) => wp.iconPngDataUrl);

  let inatImages: INatObs[] = [];
  if (input.inatParams) {
    try {
      inatImages = await fetchINatPhotos(
        input.inatParams.userId,
        input.inatParams.dateInici,
        input.inatParams.dateFinal,
      );
    } catch { /* skip */ }
  }

  const pdfDoc = await PDFDocument.create();

  const [pageW, pageH] = PageSizes.A4;
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  const M = 40;
  const cw = pageW - M * 2;
  const gray = rgb(0.4, 0.4, 0.4);
  const darkGray = rgb(0.2, 0.2, 0.2);

  function drawFooter() {
    page.drawText("Generat a senderi.cat", {
      x: pageW / 2 - 28, y: 20,
      size: 7, font: helveticaFont,
    });
  }

  function drawSectionHeader(text: string, space = 30) {
    ensureSpace(space);
    page.drawText(text, { x: M, y, size: 13, font: timesRomanBoldFont, color: darkGray });
    y -= 18;
  }

  let page = pdfDoc.addPage([pageW, pageH]);
  page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: BG_COLOR });
  let y = pageH - M;
  drawFooter();

  function ensureSpace(needed: number) {
    if (y - needed < M) {
      drawFooter();
      page = pdfDoc.addPage([pageW, pageH]);
      page.drawRectangle({ x: 0, y: 0, width: pageW, height: pageH, color: BG_COLOR });
      y = pageH - M;
      drawFooter();
    }
  }

  ensureSpace(30);
  page.drawText(input.title, { x: M, y, size: 22, font: timesRomanBoldFont });
  y -= 30;

  if (input.statsText) {
    ensureSpace(20);
    page.drawText(input.statsText, { x: M, y, size: 9, font: helveticaFont });
    y -= 20;
  }

  if (mapImageUrl) {
    const img = await pdfDoc.embedPng(mapImageUrl);
    const d = img.scaleToFit(pageW - 80, 280);
    ensureSpace(d.height + 20);
    const mx = (pageW - d.width) / 2;
    page.drawImage(img, { x: mx, y: y - d.height, width: d.width, height: d.height });
    page.drawRectangle({
      x: mx, y: y - d.height,
      width: d.width, height: d.height,
      borderColor: rgb(0.6, 0.6, 0.6),
      borderWidth: 1,
    });
    y -= d.height + 8;
    const attrEl = input.mapElement.querySelector(".leaflet-control-attribution");
    if (attrEl) {
      const attrText = attrEl.textContent?.trim() || "";
      const attrSize = 6;
      const attrW = helveticaFont.widthOfTextAtSize(attrText, attrSize);
      page.drawText(attrText, {
        x: mx + d.width - attrW, y: y,
        size: attrSize, font: helveticaFont, color: gray,
      });
      y -= 12;
    } else {
      y -= 4;
    }
  }

  if (chartImageUrl) {
    const img = await pdfDoc.embedPng(chartImageUrl);
    const d = img.scaleToFit(cw, 130);
    ensureSpace(d.height + 10);
    page.drawImage(img, { x: M, y: y - d.height, width: d.width, height: d.height });
    y -= d.height + 10;
  }

  if (input.description) {
    drawSectionHeader("Descripció");

    const lines = wrapText(input.description, helveticaFont, 10, cw);
    for (const line of lines) {
      ensureSpace(14);
      page.drawText(line, { x: M, y, size: 10, font: helveticaFont });
      y -= 14;
    }
    y -= 6;
  }

  if (input.waypoints.length > 0) {
    drawSectionHeader("Punts d'interès", 25);

    const WP_INDENT = 20;
    const WP_LIST_SZ = 20;
    const WP_DESC_X = M + WP_INDENT + WP_LIST_SZ + 8;
    const WP_DESC_W = cw - WP_INDENT - WP_LIST_SZ - 8;
    for (let i = 0; i < input.waypoints.length; i++) {
      const wp = input.waypoints[i];
      ensureSpace(36);
      if (waypointPngs[i]) {
        const icon = await pdfDoc.embedPng(waypointPngs[i]!);
        page.drawImage(icon, { x: M + WP_INDENT, y: y - WP_LIST_SZ + 2, width: WP_LIST_SZ, height: WP_LIST_SZ });
      }
      const yTitle = y - 4;
      page.drawText(wp.nom || "(sense nom)", { x: WP_DESC_X, y: yTitle, size: 10, font: helveticaBoldFont });
      y = yTitle;
      if (wp.descripcio) {
        y -= 10;
        const descLines = wrapText(wp.descripcio, helveticaFont, 9, WP_DESC_W);
        for (const line of descLines) {
          page.drawText(line, { x: WP_DESC_X, y, size: 9, font: helveticaFont });
          y -= 12;
        }
      }
      if (yTitle - y < 40) {
        y = yTitle - 40;
      }
    }
    y -= 6;
  }

  if (inatImages.length > 0) {
    drawSectionHeader("Observacions iNaturalist");

    const imgSize = 80;
    const perRow = 5;
    const gapX = (cw - perRow * imgSize) / (perRow - 1);
    const labelGap = 8;
    const labelSize = 7;
    const rowH = imgSize + labelGap + labelSize + 4;

    const totalRows = Math.ceil(inatImages.length / perRow);
    for (let row = 0; row < totalRows; row++) {
      ensureSpace(rowH);
      const rowBottom = y - rowH;

      for (let col = 0; col < perRow; col++) {
        const i = row * perRow + col;
        if (i >= inatImages.length) break;

        const ix = M + col * (imgSize + gapX);
        const obs = inatImages[i];
        const img = obs.photoDataUrl.startsWith("data:image/png")
          ? await pdfDoc.embedPng(obs.photoDataUrl)
          : await pdfDoc.embedJpg(obs.photoDataUrl);
        page.drawImage(img, { x: ix, y: rowBottom, width: imgSize, height: imgSize });

        const label = capitalizeFirst(obs.commonName) || obs.scientificName || "";
        if (label) {
          const displayLabel = truncateText(label, helveticaFont, labelSize, imgSize);
          page.drawText(displayLabel, {
            x: ix, y: rowBottom - labelGap,
            size: labelSize, font: helveticaFont, color: darkGray,
          });
        }
      }

      y -= rowH;
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
}
