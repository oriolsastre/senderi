import React, { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { haversineDistance } from "../utils/gpxUtils";
import type { Waypoint } from "../types/waypoint";
import { waypointIconMap } from "../types/waypoint";

interface ElevationChartProps {
  gpxData: string;
  trackPoints?: { lat: number; lon: number }[];
  onHoverPoint?: (index: number | null) => void;
  hoveredIndex?: number | null;
  waypoints?: Waypoint[];
  showWaypoints?: boolean;
}

interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
}

const CHART_HEIGHT = 150;
const CHART_MARGIN = { top: 20, right: 20, bottom: 30, left: 50 };
const THRESHOLD_METERS = 250;
const EARLY_TERMINATION_THRESHOLD = 25;
const MARKER_SIZE = 16;
const MARKER_OFFSET = 8;

function findNearestPointsForWaypoints(
  trackPoints: TrackPoint[],
  waypoints: Waypoint[]
): Map<number, { index: number; distance: number }> {
  const results = new Map<number, { index: number; distance: number }>();
  
  const waypointInfos = waypoints.map(wp => ({ 
    wp, 
    nearestIndex: -1, 
    nearestDistance: Infinity,
    found: false
  }));
  
  for (let i = 0; i < trackPoints.length; i++) {
    const tp = trackPoints[i];
    
    for (const info of waypointInfos) {
      if (info.found) continue;
      
      const dist = haversineDistance(info.wp.lat, info.wp.lon, tp.lat, tp.lon);
      
      if (dist < info.nearestDistance) {
        info.nearestIndex = i;
        info.nearestDistance = dist;
      }
      
      if (dist <= EARLY_TERMINATION_THRESHOLD) {
        info.found = true;
      }
    }
    
    if (waypointInfos.every(info => info.found)) {
      break;
    }
  }
  
  for (const info of waypointInfos) {
    if (info.nearestDistance <= THRESHOLD_METERS) {
      results.set(info.wp.id, {
        index: info.nearestIndex,
        distance: info.nearestDistance
      });
    }
  }
  
  return results;
}

function parseGPX(gpxString: string): TrackPoint[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(gpxString, "application/xml");
  const trkpts = doc.querySelectorAll("trkpt");
  
  const points: TrackPoint[] = [];
  trkpts.forEach((pt) => {
    const lat = parseFloat(pt.getAttribute("lat") || "0");
    const lon = parseFloat(pt.getAttribute("lon") || "0");
    const ele = parseFloat(pt.querySelector("ele")?.textContent || "0");
    points.push({ lat, lon, ele });
  });
  
  return points;
}

function calculateDistance(points: TrackPoint[]): number[] {
  const distances: number[] = [0];
  
  for (let i = 1; i < points.length; i++) {
    const segmentDist = haversineDistance(
      points[i - 1].lat, points[i - 1].lon,
      points[i].lat, points[i].lon
    );
    distances.push(distances[i - 1] + segmentDist);
  }
  
  return distances;
}

export function ElevationChart({ gpxData, trackPoints, onHoverPoint, hoveredIndex, waypoints, showWaypoints = true }: ElevationChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(600);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; elevation: number; distance: number } | null>(null);
  const [waypointSvgCache, setWaypointSvgCache] = useState<Record<string, string>>({});
  const [hoveredWaypoint, setHoveredWaypoint] = useState<{ wp: Waypoint; x: number; y: number } | null>(null);

  const points = useMemo(() => parseGPX(gpxData), [gpxData]);
  const distances = useMemo(() => calculateDistance(points), [points]);

  useEffect(() => {
    const iconNames = [...new Set(Object.values(waypointIconMap))];
    Promise.all(
      iconNames.map(name =>
        fetch(`/assets/icons/${name}.svg`)
          .then(r => r.text())
          .then(svg => ({ name, svg }))
      )
    ).then(results => {
      const cache: Record<string, string> = {};
      results.forEach(({ name, svg }) => { cache[name] = svg; });
      setWaypointSvgCache(cache);
    });
  }, []);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (!gpxData || !svgRef.current || points.length === 0) return;

    const elevations = points.map((p) => p.ele);

    const innerWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
    const innerHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width)
      .attr("height", CHART_HEIGHT)
      .append("g")
      .attr("transform", `translate(${CHART_MARGIN.left},${CHART_MARGIN.top})`);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(distances) || 0])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(elevations) || 0, d3.max(elevations) || 0])
      .range([innerHeight, 0]);

    const area = d3
      .area<number>()
      .x((_, i) => xScale(distances[i]))
      .y0(innerHeight)
      .y1((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    const line = d3
      .line<number>()
      .x((_, i) => xScale(distances[i]))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    const gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "ele-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#8B4513");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#228B22");

    g.append("path")
      .datum(elevations)
      .attr("fill", "url(#ele-gradient)")
      .attr("opacity", 0.7)
      .attr("d", area);

    g.append("path")
      .datum(elevations)
      .attr("fill", "none")
      .attr("stroke", "#654321")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    if (showWaypoints && waypoints && waypoints.length > 0 && Object.keys(waypointSvgCache).length > 0) {
      const nearestPoints = findNearestPointsForWaypoints(points, waypoints);

      waypoints.forEach((wp) => {
        const tipus = wp.tipus?.toLowerCase();
        const iconName = waypointIconMap[tipus || "altres"];
        const svgContent = waypointSvgCache[iconName];

        if (!svgContent) return;

        const nearest = nearestPoints.get(wp.id);
        if (!nearest) return;

        const { index } = nearest;
        const xPos = xScale(distances[index]);
        const yPos = yScale(points[index].ele) - MARKER_OFFSET;

        const cleanedSvg = svgContent
          .replace(/\s*width="[^"]*"/, "")
          .replace(/\s*height="[^"]*"/, "")
          .replace(/\s*id="[^"]*"/, "");

        const svgDataUrl = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(cleanedSvg);

        const markerGroup = g.append("g")
          .attr("class", "waypoint-marker")
          .style("cursor", "pointer")
          .on("mouseenter", function(event) {
            const rect = svgRef.current?.getBoundingClientRect();
            if (rect) {
              setHoveredWaypoint({
                wp,
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
              });
            }
          })
          .on("mouseleave", function() {
            setHoveredWaypoint(null);
          });

        markerGroup.append("circle")
          .attr("cx", xPos)
          .attr("cy", yPos)
          .attr("r", MARKER_SIZE / 2 + 2)
          .attr("fill", "white")
          .attr("stroke", "#9333ea")
          .attr("stroke-width", 2);

        markerGroup.append("image")
          .attr("href", svgDataUrl)
          .attr("x", xPos - MARKER_SIZE / 2)
          .attr("y", yPos - MARKER_SIZE / 2)
          .attr("width", MARKER_SIZE)
          .attr("height", MARKER_SIZE)
          .attr("preserveAspectRatio", "xMidYMid meet");
      });
    }

    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat((d) => `${(d as number) / 1000}`))
      .append("text")
      .attr("x", innerWidth / 2)
      .attr("y", 25)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .text("Distància (km)");

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -40)
      .attr("x", -innerHeight / 2)
      .attr("fill", "currentColor")
      .attr("text-anchor", "middle")
      .text("Elevació (m)");
  }, [gpxData, width, onHoverPoint, waypoints, waypointSvgCache, showWaypoints]);

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onHoverPoint || points.length === 0) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    
    const innerWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
    
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(distances) || 0])
      .range([0, innerWidth]);
    
    const hoveredDistance = xScale.invert(mouseX - CHART_MARGIN.left);
    
    let closestIndex = 0;
    let closestDist = Math.abs(distances[0] - hoveredDistance);
    for (let i = 1; i < distances.length; i++) {
      const dist = Math.abs(distances[i] - hoveredDistance);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }
    
    onHoverPoint(closestIndex);
    
    const point = points[closestIndex];
    const innerHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
    
    const yScale = d3.scaleLinear()
      .domain([d3.min(points.map(p => p.ele)) || 0, d3.max(points.map(p => p.ele)) || 0])
      .range([innerHeight, 0]);
    
    const xPos = mouseX;
    const yPos = CHART_MARGIN.top + yScale(point.ele);
    
    setHoverInfo({
      x: xPos,
      y: yPos,
      elevation: point.ele,
      distance: distances[closestIndex],
    });
  };

  const handleMouseLeave = () => {
    if (onHoverPoint) {
      onHoverPoint(null);
    }
    setHoverInfo(null);
  };

  useEffect(() => {
    if (hoveredIndex !== undefined && hoveredIndex !== null && points.length > 0) {
      if (hoveredIndex >= 0 && hoveredIndex < points.length) {
        const point = points[hoveredIndex];
        const innerHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
        
        const xScale = d3.scaleLinear()
          .domain([0, d3.max(distances) || 0])
          .range([0, width - CHART_MARGIN.left - CHART_MARGIN.right]);
        
        const yScale = d3.scaleLinear()
          .domain([d3.min(points.map(p => p.ele)) || 0, d3.max(points.map(p => p.ele)) || 0])
          .range([innerHeight, 0]);
        
        const xPos = CHART_MARGIN.left + xScale(distances[hoveredIndex]);
        const yPos = CHART_MARGIN.top + yScale(point.ele);
        
        setHoverInfo({
          x: xPos,
          y: yPos,
          elevation: point.ele,
          distance: distances[hoveredIndex],
        });
      }
    } else if (hoveredIndex === null || hoveredIndex === undefined) {
      setHoverInfo(null);
    }
  }, [hoveredIndex, points, distances, width]);

  return (
    <div ref={containerRef} className="w-full relative" style={{ zIndex: 1000, position: 'relative' }}>
      <svg 
        ref={svgRef} 
        className="w-full h-[150px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {hoverInfo && (
        <>
          <div 
            className="absolute bg-white border rounded px-2 py-1 text-sm shadow pointer-events-none z-50"
            style={{ 
              left: hoverInfo.x, 
              top: hoverInfo.y - 10,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="font-medium">{Math.round(hoverInfo.elevation)}m</div>
            <div className="text-gray-500 text-xs">{(hoverInfo.distance / 1000).toFixed(1)} km</div>
          </div>
          <div 
            className="absolute w-3 h-3 bg-black rounded-full border-2 border-white pointer-events-none z-40"
            style={{
              left: hoverInfo.x,
              top: hoverInfo.y,
              transform: 'translate(-50%, -50%)'
            }}
          />
        </>
      )}
      {hoveredWaypoint && (
        <div 
          className="absolute bg-white border border-purple-500 rounded px-2 py-1 text-sm shadow pointer-events-none z-50"
          style={{
            left: hoveredWaypoint.x,
            top: hoveredWaypoint.y + 10,
            transform: 'translate(-50%, 0)'
          }}
        >
          {hoveredWaypoint.wp.nom || hoveredWaypoint.wp.tipus}
        </div>
      )}
    </div>
  );
}