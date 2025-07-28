"use client";

import { useRef, useState, useEffect } from 'react';
import type { Room, Furniture, Annotation, Point } from '@/lib/types';
import { useDraggable } from '@/hooks/use-draggable';
import { cn } from '@/lib/utils';

interface CanvasProps {
  tool: string;
  rooms: Room[];
  furniture: Furniture[];
  annotations: Annotation[];
  selectedItem: Room | Furniture | Annotation | null;
  onSelectItem: (item: Room | Furniture | Annotation | null) => void;
  onUpdateItem: (item: Room | Furniture | Annotation) => void;
  backgroundImage: string | null;
  setTool: (tool: string) => void;
}

export function Canvas({
  tool,
  rooms,
  furniture,
  annotations,
  selectedItem,
  onSelectItem,
  onUpdateItem,
  backgroundImage,
  setTool,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 100, height: 100 });
  
  useEffect(() => {
    if (svgRef.current) {
      const { width, height } = svgRef.current.getBoundingClientRect();
      setViewBox({ x: 0, y: 0, width, height });
    }
  }, []);

  const { draggingItem, panning, panStart, handleMouseDown, handleMouseMove, handleMouseUp } = useDraggable({
    svgRef,
    tool,
    onSelectItem,
    onUpdateItem,
    viewBox,
    setViewBox,
    setTool
  });

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || e.target === svgRef.current?.firstChild) {
        onSelectItem(null);
    }
  };

  return (
    <div className="w-full h-full bg-secondary/30" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onClick={handleCanvasClick} onMouseDown={handleMouseDown}>
      <svg ref={svgRef} width="100%" height="100%" viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className={cn("w-full h-full", {
        'cursor-grab': tool === 'pan',
        'cursor-grabbing': panning,
        'cursor-default': tool !== 'pan'
      })}>
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" transform={`translate(${viewBox.x}, ${viewBox.y})`} />
        
        {backgroundImage && (
          <image href={backgroundImage} x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{opacity: 0.5}} />
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
        </g>
      </svg>
    </div>
  );
}
