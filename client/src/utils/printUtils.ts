export interface LocalWaypoint {
  id: string;
  lat: number;
  lon: number;
  nom: string;
  descripcio: string;
  tipus: string;
}

export function svgHtmlToPng(svgHtml: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const c = document.createElement("canvas");
      c.width = 48; c.height = 48;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, 48, 48);
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, 48, 48); resolve(c.toDataURL("image/png")); };
      img.onerror = () => resolve(null);
      img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgHtml)))}`;
    } catch { resolve(null); }
  });
}

export function imgFileToPng(src: string, size: number): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = size; c.height = size;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, size, size);
      resolve(c.toDataURL("image/png"));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
