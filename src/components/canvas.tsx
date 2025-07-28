"use client";

import { useRef, useState, useEffect } from 'react';
import type { Room, Furniture, Annotation, Point, Measurement } from '@/lib/types';
import { useDraggable } from '@/hooks/use-draggable';
import { cn } from '@/lib/utils';
import { getDistance, formatDistance } from '@/lib/geometry';

interface CanvasProps {
  tool: string;
  rooms: Room[];
  furniture: Furniture[];
  annotations: Annotation[];
  measurements: Measurement[];
  setMeasurements: React.Dispatch<React.SetStateAction<Measurement[]>>;
  scale: { pixels: number, meters: number };
  selectedItem: Room | Furniture | Annotation | Measurement | null;
  onSelectItem: (item: Room | Furniture | Annotation | Measurement | null) => void;
  onUpdateItem: (item: Room | Furniture | Annotation | Measurement) => void;
  backgroundImage: string | null;
  setTool: (tool: string) => void;
}

export function Canvas({
  tool,
  rooms,
  furniture,
  annotations,
  measurements,
  setMeasurements,
  scale,
  selectedItem,
  onSelectItem,
  onUpdateItem,
  backgroundImage,
  setTool,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentMeasureLine, setCurrentMeasureLine] = useState<Measurement | null>(null);

  
  useEffect(() => {
    if (svgRef.current) {
      const { width, height } = svgRef.current.getBoundingClientRect();
      setViewBox({ x: 0, y: 0, width, height });
    }
  }, []);

  const getSVGPoint = (e: React.MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (ctm) {
      const svgPoint = pt.matrixTransform(ctm.inverse());
      return { x: svgPoint.x, y: svgPoint.y };
    }
    return { x: 0, y: 0 };
  };

  const { draggingItem, panning, panStart, handleMouseDown: handleDraggableMouseDown, handleMouseMove: handleDraggableMouseMove, handleMouseUp: handleDraggableMouseUp } = useDraggable({
    svgRef,
    tool,
    onSelectItem,
    onUpdateItem,
    viewBox,
    setViewBox,
    setTool
  });

  const handleMouseDown = (e: React.MouseEvent, item?: Room | Furniture | Annotation) => {
    const point = getSVGPoint(e);
    if (tool === 'measure') {
      e.stopPropagation();
      setIsMeasuring(true);
      const newLine: Measurement = {
        id: `measure-${Date.now()}`,
        type: 'measurement',
        start: point,
        end: point,
      };
      setCurrentMeasureLine(newLine);
      setMeasurements(prev => [...prev, newLine]);
    } else {
      handleDraggableMouseDown(e, item);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tool === 'measure' && isMeasuring && currentMeasureLine) {
      const point = getSVGPoint(e);
      const updatedLine = { ...currentMeasureLine, end: point };
      setCurrentMeasureLine(updatedLine);
      setMeasurements(prev => prev.map(m => m.id === updatedLine.id ? updatedLine : m));
    } else {
      handleDraggableMouseMove(e);
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (tool === 'measure' && isMeasuring && currentMeasureLine) {
      onSelectItem(currentMeasureLine);
      setIsMeasuring(false);
      setCurrentMeasureLine(null);
    } else {
      handleDraggableMouseUp();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || e.target === svgRef.current?.firstChild) {
        onSelectItem(null);
    }
  };

  const allItems = [...rooms, ...furniture, ...annotations, ...measurements];

  return (
    <div className="w-full h-full bg-secondary/30" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseDown={handleMouseDown} onClick={handleCanvasClick}>
      <svg ref={svgRef} width="100%" height="100%" viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className={cn("w-full h-full", {
        'cursor-grab': tool === 'pan',
        'cursor-grabbing': panning,
        'cursor-crosshair': tool === 'measure',
        'cursor-default': tool !== 'pan' && tool !== 'measure',
      })}>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" transform={`translate(${viewBox.x}, ${viewBox.y})`} />
        
        {backgroundImage && (
          <image href={backgroundImage} x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{opacity: 0.5}} />
        )}
        
        <g>
          {rooms.map((room) => (
            <g key={room.id} onMouseDown={(e) => handleMouseDown(e, room)} className={tool === 'select' ? 'cursor-move' : ''}>
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill="hsl(var(--primary) / 0.3)"
                stroke="hsl(var(--primary))"
                strokeWidth={selectedItem?.id === room.id ? 2 : 1}
                className="transition-all"
              />
              <text x={room.x + 10} y={room.y + 20} fill="hsl(var(--foreground))" fontSize="12" pointerEvents="none" className="select-none">
                {room.name}
              </text>
            </g>
          ))}

          {furniture.map((item) => (
            <g key={item.id} onMouseDown={(e) => handleMouseDown(e, item)} className={tool === 'select' ? 'cursor-move' : ''} transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation} ${item.width/2} ${item.height/2})`}>
              <rect
                x={0}
                y={0}
                width={item.width}
                height={item.height}
                fill="hsl(var(--accent) / 0.6)"
                stroke="hsl(var(--accent-foreground))"
                strokeWidth={selectedItem?.id === item.id ? 2 : 1}
                rx="4"
                className="transition-all"
              />
              <text x={item.width / 2} y={item.height / 2} textAnchor="middle" dy=".3em" fill="hsl(var(--accent-foreground))" fontSize="10" pointerEvents="none" className="select-none">
                {item.name}
              </text>
            </g>
          ))}

          {annotations.map((note) => (
            <g key={note.id} onMouseDown={(e) => handleMouseDown(e, note)} className={tool === 'select' ? 'cursor-move' : ''}>
              <foreignObject x={note.x} y={note.y} width="120" height="80">
                  <div className="p-2 text-xs bg-card border rounded-md shadow-md h-full w-full overflow-hidden text-ellipsis select-none">
                    {note.text}
                  </div>
              </foreignObject>
            </g>
          ))}

          {measurements.map((line) => {
            const distance = getDistance(line.start, line.end);
            const midX = (line.start.x + line.end.x) / 2;
            const midY = (line.start.y + line.end.y) / 2;
            const angle = Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x) * 180 / Math.PI;

            return (
            <g key={line.id}>
              <line
                x1={line.start.x}
                y1={line.start.y}
                x2={line.end.x}
                y2={line.end.y}
                stroke="hsl(var(--destructive))"
                strokeWidth={selectedItem?.id === line.id ? 3 : 2}
                strokeDasharray="5,5"
              />
              <circle cx={line.start.x} cy={line.start.y} r="4" fill="hsl(var(--destructive))" />
              <circle cx={line.end.x} cy={line.end.y} r="4" fill="hsl(var(--destructive))" />
              <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
                  <text 
                      y={-8}
                      textAnchor="middle"
                      fill="hsl(var(--destructive-foreground))"
                      fontSize="12"
                      paintOrder="stroke"
                      stroke="hsl(var(--destructive))"
                      strokeWidth="2px"
                      strokeLinecap="butt"
                      strokeLinejoin="miter"
                      className="font-semibold select-none"
                  >
                      {formatDistance(distance, scale)}
                  </text>
              </g>
            </g>
          )})}

        </g>
      </svg>
    </div>
  );
}
