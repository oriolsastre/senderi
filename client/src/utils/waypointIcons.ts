import L from "leaflet";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { MapIcon, CloudArrowUpIcon, XMarkIcon } from "@heroicons/react/24/solid";
import type { Waypoint } from "../types/waypoint";

export const createWaypointIcon = (color: string = "#9333ea"): L.DivIcon =>
  L.divIcon({
    className: "custom-marker",
    html: ReactDOMServer.renderToStaticMarkup(
      React.createElement(MapIcon, { className: "w-6 h-6", style: { color } })
    ),
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  });

export const createWaypointPopupContent = (wp: Waypoint, excursioId?: number, belongsToHike?: boolean): string => {
  const title = wp.nom || wp.tipus;
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
    links.push(`<a href="https://www.wikidata.org/wiki/Q${wp.wikidata}" target="_blank" rel="noopener noreferrer"><img src="/assets/icons/services/wikidata-logo.svg" alt="Wikidata" style="width:16px;height:16px;vertical-align:middle;margin-left:4px;"></a>`);
  }
  if (wp.osm_node) {
    links.push(`<a href="https://www.openstreetmap.org/node/${wp.osm_node}" target="_blank" rel="noopener noreferrer"><img src="/assets/icons/services/openstreetmap-logo.svg" alt="OSM" style="width:16px;height:16px;vertical-align:middle;margin-left:4px;"></a>`);
  }
  if (links.length > 0) {
    content += `<div style="margin-top:4px;">${links.join("")}</div>`;
  }

  return content;
};