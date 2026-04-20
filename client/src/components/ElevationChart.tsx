import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface ElevationChartProps {
  gpxData: string;
  trackPoints?: { lat: number; lon: number }[];
  onHoverPoint?: (index: number | null) => void;
  hoveredIndex?: number | null;
}

interface TrackPoint {
  lat: number;
  lon: number;
  ele: number;
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
    const prev = points[i - 1];
    const curr = points[i];
    
    const R = 6371e3;
    const φ1 = (prev.lat * Math.PI) / 180;
    const φ2 = (curr.lat * Math.PI) / 180;
    const Δφ = ((curr.lat - prev.lat) * Math.PI) / 180;
    const Δλ = ((curr.lon - prev.lon) * Math.PI) / 180;
    
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    distances.push(distances[i - 1] + distance);
  }
  
  return distances;
}

export function ElevationChart({ gpxData, trackPoints, onHoverPoint, hoveredIndex }: ElevationChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(600);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; elevation: number; distance: number } | null>(null);

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
    if (!gpxData || !svgRef.current) return;

    const points = parseGPX(gpxData);
    if (points.length === 0) return;

    const distances = calculateDistance(points);
    const elevations = points.map((p) => p.ele);

    const height = 150;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

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
  }, [gpxData, width, onHoverPoint]);

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !onHoverPoint) return;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    
    const points = parseGPX(gpxData);
    if (points.length === 0) return;
    
    const distances = calculateDistance(points);
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(distances) || 0])
      .range([0, innerWidth]);
    
    const hoveredDistance = xScale.invert(mouseX - margin.left);
    
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
    const chartMargin = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartInnerHeight = 150 - chartMargin.top - chartMargin.bottom;
    
    const yScale = d3.scaleLinear()
      .domain([d3.min(points.map(p => p.ele)) || 0, d3.max(points.map(p => p.ele)) || 0])
      .range([chartInnerHeight, 0]);
    
    const xPos = mouseX;
    const yPos = chartMargin.top + yScale(point.ele);
    
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
    if (trackPoints && trackPoints.length > 0 && hoveredIndex !== undefined && hoveredIndex !== null) {
      const index = hoveredIndex;
      if (index >= 0 && index < trackPoints.length) {
        const points = parseGPX(gpxData);
        if (points[index]) {
          const distances = calculateDistance(points);
          const point = points[index];
          const margin = { top: 20, right: 20, bottom: 30, left: 50 };
          const innerHeight = 150 - margin.top - margin.bottom;
          
          const xScale = d3.scaleLinear()
            .domain([0, d3.max(distances) || 0])
            .range([0, width - margin.left - margin.right]);
          
          const yScale = d3.scaleLinear()
            .domain([d3.min(points.map(p => p.ele)) || 0, d3.max(points.map(p => p.ele)) || 0])
            .range([innerHeight, 0]);
          
          const xPos = margin.left + xScale(distances[index]);
          const yPos = margin.top + yScale(point.ele);
          
          setHoverInfo({
            x: xPos,
            y: yPos,
            elevation: point.ele,
            distance: distances[index],
          });
        }
      }
    } else if (hoveredIndex === null || hoveredIndex === undefined) {
      setHoverInfo(null);
    }
  }, [hoveredIndex, trackPoints]);

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
    </div>
  );
}