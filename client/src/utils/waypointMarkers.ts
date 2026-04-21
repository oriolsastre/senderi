import L from "leaflet";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { MapIcon, CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/solid";
import type { Waypoint } from "../types/waypoint";

const mountainPath = "M7.5,2C7.2,2,7.1,2.2,6.9,2.4l-5.8,9.5C1,12,1,12.2,1,12.3C1,12.8,1.4,13,1.7,13h11.6c0.4,0,0.7-0.2,0.7-0.7c0-0.2,0-0.2-0.1-0.4L8.2,2.4C8,2.2,7.8,2,7.5,2z M7.5,3.5L10.8,9H10L8.5,7.5L7.5,9l-1-1.5L5,9H4.1L7.5,3.5z";

const collPath = "M1.5,12 L1.5,8 C1.5,5 3.5,2 5,5 C6,7 7.5,10 7.5,10 C7.5,10 9,7 10,5 C11.5,2 13.5,5 13.5,8 L13.5,12 L7.5,12 L1.5,12z";

export const createWaypointIcon = (wp: Waypoint): L.DivIcon => {
  const tipus = wp.tipus?.toLowerCase();
  
  switch (tipus) {
    case "cim": {
      const color = getElevationColor(wp.elevacio);
      return L.divIcon({
        className: "custom-marker",
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="32" height="32"><path d="${mountainPath}" fill="${color}" stroke="#000000" stroke-width="0.5"/></svg>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });
    }
    case "coll": {
      const color = getElevationColor(wp.elevacio);
      return L.divIcon({
        className: "custom-marker",
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 15 15" width="24" height="24"><path d="${collPath}" fill="${color}" stroke="#000000" stroke-width="0.5"/></svg>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });
    }
    default:
      return L.divIcon({
        className: "custom-marker",
        html: ReactDOMServer.renderToStaticMarkup(
          React.createElement(MapIcon, { className: "w-8 h-8", style: { color: "#000000" } })
        ),
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
  }
};

export const createWaypointPopupContent = (wp: Waypoint, excursioId?: number, belongsToHike?: boolean): string => {
  let title = wp.nom || wp.tipus;
  if ((wp.tipus?.toLowerCase() === "cim" || wp.tipus?.toLowerCase() === "coll") && wp.elevacio) {
    title = `${title} (${wp.elevacio}m)`;
  }
  let actionIconsHtml = "";
  if (excursioId && !belongsToHike) {
    const addIcon = ReactDOMServer.renderToStaticMarkup(
      React.createElement(CloudArrowUpIcon, { className: "w-4 h-4", style: { color: "#22c55e", cursor: "pointer" } })
    );
    actionIconsHtml += `<span onclick="window.addWaypointToHike(${excursioId}, ${wp.id})" style="display:inline-flex;cursor:pointer;vertical-align:middle;margin-left:4px;">${addIcon}</span>`;
  } else if (excursioId && belongsToHike) {
    const deleteIcon = ReactDOMServer.renderToStaticMarkup(
      React.createElement(XMarkIcon, { className: "w-4 h-4", style: { color: "#ef4444", cursor: "pointer" } })
    );
    actionIconsHtml += `<span onclick="window.removeWaypointFromHike(${excursioId}, ${wp.id})" style="display:inline-flex;cursor:pointer;vertical-align:middle;margin-left:4px;">${deleteIcon}</span>`;
  }

  let titleHtml = `<strong>${title}</strong>`;
  let content = `<div style="display:flex;align-items:center;gap:4px;">${titleHtml}${actionIconsHtml}</div>`;
  
  if (wp.comentari) {
    content += `<div>${wp.comentari}</div>`;
  }

  const links: string[] = [];
  if (wp.wikidata) {
    links.push(`<a href="https://www.wikidata.org/wiki/${wp.wikidata}" target="_blank" rel="noopener noreferrer" title="Veure a Wikidata"><img src="/assets/icons/services/wikidata-logo.svg" alt="Wikidata" style="width:16px;height:16px;vertical-align:middle;margin-left:4px;"></a>`);
  }
  if (wp.osm_node) {
    links.push(`<a href="https://www.openstreetmap.org/node/${wp.osm_node}" target="_blank" rel="noopener noreferrer" title="Veure a OSM"><img src="/assets/icons/services/openstreetmap-logo.svg" alt="OSM" style="width:16px;height:16px;vertical-align:middle;margin-left:4px;"></a>`);
  }
  if (links.length > 0) {
    content += `<div style="margin-top:4px;display:flex;justify-content:flex-end;gap:4px;">${links.join("")}</div>`;
  }

  return content;
};

interface ElevationRange {
  min: number;
  max: number;
  color: string;
}

const elevationRanges: ElevationRange[] = [
  { min: 0, max: 500, color: "#60a5fa" },
  { min: 500, max: 1000, color: "#22c55e" },
  { min: 1000, max: 1500, color: "#eab308" },
  { min: 1500, max: 2000, color: "#f97316" },
  { min: 2500, max: 3000, color: "#ef4444" },
  { min: 3000, max: Infinity, color: "#000000" },
];

const getElevationColor = (elevation: number | null | undefined): string => {
  const elev = elevation ?? 0;
  
  for (const range of elevationRanges) {
    if (elev >= range.min && elev < range.max) {
      return range.color;
    }
  }
  return "#60a5fa";
};
