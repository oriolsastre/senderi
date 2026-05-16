import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function CoordinateDisplay() {
  const map = useMap();
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = map.getContainer().querySelector<HTMLElement>(".leaflet-bottom.leaflet-left");
    if (!container) return;

    const div = L.DomUtil.create("div") as HTMLDivElement;
    div.style.cssText =
      "visibility:hidden;float:left;margin:0 0 10px 4px;background:rgba(255,255,255,0.8);padding:1px 8px;font-size:12px;line-height:1.4;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.2);";
    div.textContent = "\u00A0";
    L.DomEvent.disableClickPropagation(div);
    L.DomEvent.disableScrollPropagation(div);
    container.appendChild(div);
    elRef.current = div;

    const moveHandler = (e: L.LeafletMouseEvent) => {
      if (!elRef.current) return;
      const { lat, lng } = e.latlng;
      const latDir = lat >= 0 ? "N" : "S";
      const lngDir = lng >= 0 ? "E" : "W";
      elRef.current.style.visibility = "visible";
      elRef.current.textContent =
        `${Math.abs(lat).toFixed(5)}\u00B0${latDir}, ${Math.abs(lng).toFixed(5)}\u00B0${lngDir}`;
    };
    const outHandler = () => {
      if (!elRef.current) return;
      elRef.current.style.visibility = "hidden";
    };
    map.on("mousemove", moveHandler);
    map.on("mouseout", outHandler);

    return () => {
      map.off("mousemove", moveHandler);
      map.off("mouseout", outHandler);
      if (elRef.current && elRef.current.parentNode) {
        elRef.current.parentNode.removeChild(elRef.current);
      }
      elRef.current = null;
    };
  }, [map]);

  return null;
}
