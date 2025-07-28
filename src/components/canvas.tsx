"use client";

import { useRef, useState, useEffect } from 'react';
import type { Room, Furniture, Annotation, Point, Measurement, BaseItem, Surface } from '@/lib/types';
import { useDraggable } from '@/hooks/use-draggable';
import { cn } from '@/lib/utils';
import { getDistance, formatDistance } from '@/lib/geometry';

interface CanvasProps {
  tool: string;
  items: BaseItem[];
  setItems: (items: BaseItem[]) => void;
  scale: { pixels: number, meters: number };
  setScale: (scale: { pixels: number, meters: number }) => void;
  selectedItem: BaseItem | null;
  onSelectItem: (item: BaseItem | null) => void;
  onUpdateItem: (item: BaseItem) => void;
  backgroundImage: string | null;
  setTool: (tool: string) => void;
}

const surfaceColors: Record<Surface['surfaceType'], string> = {
  wall: 'hsl(var(--foreground) / 0.8)',
  window: 'hsl(var(--primary) / 0.8)',
  door: 'hsl(var(--destructive) / 0.7)',
  other: 'hsl(var(--accent) / 0.8)',
};

export function Canvas({
  tool,
  items,
  setItems,
  scale,
  setScale,
  selectedItem,
  onSelectItem,
  onUpdateItem,
  backgroundImage,
  setTool,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentMeasurementId, setCurrentMeasurementId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState<{pointIndex: number, corner: string} | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setViewBox(vb => ({ ...vb, width, height }));
      }
    });
    if (svgRef.current) {
      resizeObserver.observe(svgRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height });
      };
      img.src = backgroundImage;
    }
  }, [backgroundImage]);
  
  const getSVGPoint = (e: React.MouseEvent | MouseEvent): Point => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (ctm) {
      return pt.matrixTransform(ctm.inverse());
    }
    return { x: 0, y: 0 };
  };

  const { handleMouseDown: handleDraggableMouseDown } = useDraggable({
    svgRef,
    tool,
    onSelectItem,
    onUpdateItem,
    viewBox,
    setViewBox,
    setTool,
    selectedItem,
  });

  const handleMouseDown = (e: React.MouseEvent, item?: BaseItem) => {
    e.stopPropagation();
    const point = getSVGPoint(e);
    
    if (tool === 'measure') {
      setIsMeasuring(true);
      const isFirstMeasurement = !items.some(i => i.type === 'measurement' && i.isReference);
      const newId = `measure-${Date.now()}`;
      const newLine: Measurement = {
        id: newId, type: 'measurement', start: point, end: point, visible: true, isReference: isFirstMeasurement,
      };
      setCurrentMeasurementId(newId);
      setItems([...items, newLine]);
    } else {
      handleDraggableMouseDown(e, item);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tool === 'measure' && isMeasuring && currentMeasurementId) {
      const point = getSVGPoint(e);
      const currentLine = items.find(i => i.id === currentMeasurementId) as Measurement;
      if (currentLine) {
        const updatedLine = { ...currentLine, end: point };
        onUpdateItem(updatedLine);
      }
    } else if (isResizing && selectedItem?.type === 'room') {
        const room = selectedItem as Room;
        const point = getSVGPoint(e);
        const newPoints = [...room.points];

        newPoints[isResizing.pointIndex] = point;
        
        // Adjust adjacent points for rectangular shapes
        if (room.points.length === 4) { // Assuming a rectangle for now
          const prevIndex = (isResizing.pointIndex - 1 + 4) % 4;
          const nextIndex = (isResizing.pointIndex + 1) % 4;

          if (isResizing.corner.includes('top') || isResizing.corner.includes('bottom')) {
            newPoints[prevIndex].y = point.y;
            newPoints[nextIndex].y = point.y;
          }
          if (isResizing.corner.includes('left') || isResizing.corner.includes('right')) {
             newPoints[prevIndex].x = point.x;
             newPoints[nextIndex].x = point.x;
          }
          // For corners, need to update two points
          if(isResizing.corner === 'top-left') {
            newPoints[3].x = point.x;
            newPoints[1].y = point.y;
          } else if(isResizing.corner === 'top-right') {
            newPoints[0].y = point.y;
            newPoints[2].x = point.x;
          } else if(isResizing.corner === 'bottom-left') {
            newPoints[1].x = point.x;
            newPoints[3].y = point.y;
          } else if(isResizing.corner === 'bottom-right') {
            newPoints[2].y = point.y;
            newPoints[0].x = point.x;
          }
        }

        onUpdateItem({ ...room, points: newPoints });
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (tool === 'measure' && isMeasuring) {
      const point = getSVGPoint(e);
      const currentLine = items.find(i => i.id === currentMeasurementId) as Measurement;
      if(currentLine) onSelectItem(currentLine)
      setIsMeasuring(false);
      setCurrentMeasurementId(null);
      setTool('select');
    }
    if (isResizing) {
        setIsResizing(null);
    }
  };


  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as SVGElement).tagName === 'image' || ((e.target as SVGElement).tagName === 'rect' && !(e.target as SVGElement).hasAttribute('data-item-id'))) {
        onSelectItem(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!svgRef.current) return;
    e.preventDefault();
    const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;
    const point = getSVGPoint(e);

    const newWidth = viewBox.width * scaleFactor;
    const newHeight = viewBox.height * scaleFactor;
    const newX = viewBox.x - (point.x - viewBox.x) * (scaleFactor - 1);
    const newY = viewBox.y - (point.y - viewBox.y) * (scaleFactor - 1);
    
    setViewBox({ x: newX, y: newY, width: newWidth, height: newHeight });
  };
  
  const allItems = items;
  const rooms = allItems.filter(i => i.type === 'room') as Room[];
  const furniture = allItems.filter(i => i.type === 'furniture') as Furniture[];
  const annotations = allItems.filter(i => i.type === 'annotation') as Annotation[];
  const measurements = allItems.filter(i => i.type === 'measurement') as Measurement[];
  const surfaces = allItems.filter(i => i.type === 'surface') as Surface[];
  
  const getRoomPath = (room: Room) => {
    if (!room.points || room.points.length === 0) return "";
    const path = room.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${path} Z`;
  };


  const renderResizeHandles = (room: Room) => {
    const handleSize = 8;
    const halfHandle = handleSize / 2;
    
    const corners = [
        { pointIndex: 0, corner: 'top-left' },
        { pointIndex: 1, corner: 'top-right' },
        { pointIndex: 2, corner: 'bottom-right' },
        { pointIndex: 3, corner: 'bottom-left' },
    ];
    
    return room.points.map((p, index) => (
      <rect
        key={index}
        x={p.x - halfHandle}
        y={p.y - halfHandle}
        width={handleSize}
        height={handleSize}
        fill="hsl(var(--ring))"
        stroke="hsl(var(--background))"
        strokeWidth="1"
        className="cursor-nwse-resize"
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing({pointIndex: index, corner: corners.find(c=>c.pointIndex === index)?.corner || ''});
        }}
      />
    ));
  };
  
  const renderRoomDimensions = (room: Room) => {
    const offset = 15;
    const textStyle = {
      fontSize: "12px",
      fill: "hsl(var(--foreground))",
      textAnchor: "middle" as const,
      paintOrder: "stroke" as const,
      stroke: "hsl(var(--background))",
      strokeWidth:"3px",
      strokeLinecap: "butt" as const,
      strokeLinejoin: "miter" as const,
      className: "font-semibold select-none"
    };

    if (room.points.length !== 4) return null;

    const width = getDistance(room.points[0], room.points[1]);
    const height = getDistance(room.points[1], room.points[2]);
    const midPointTop = { x: (room.points[0].x + room.points[1].x) / 2, y: (room.points[0].y + room.points[1].y) / 2 };
    const midPointRight = { x: (room.points[1].x + room.points[2].x) / 2, y: (room.points[1].y + room.points[2].y) / 2 };
    const angleRight = Math.atan2(room.points[2].y - room.points[1].y, room.points[2].x - room.points[1].x) * 180 / Math.PI;

    return (<>
      <text x={midPointTop.x} y={midPointTop.y - offset} {...textStyle}>
        {formatDistance(width, scale)}
      </text>
      <text x={midPointRight.x + offset} y={midPointRight.y} transform={`rotate(${angleRight}, ${midPointRight.x + offset}, ${midPointRight.y})`} {...textStyle}>
        {formatDistance(height, scale)}
      </text>
    </>);
  };


  return (
    <div className="w-full h-full bg-secondary/30" onClick={handleCanvasClick} onWheel={handleWheel}>
       <svg ref={svgRef} width="100%" height="100%" viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className={cn("w-full h-full", {
        'cursor-grab': tool === 'pan',
        'cursor-grabbing': (tool === 'pan' && (e => e.buttons === 1)),
        'cursor-crosshair': tool === 'measure',
        'cursor-default': tool !== 'pan' && tool !== 'measure',
      })}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" x={viewBox.x} y={viewBox.y} />
        
        {backgroundImage && (
            <image href={backgroundImage} x="0" y="0" width={imageDimensions.width} height={imageDimensions.height} style={{opacity: 0.5}} />
        )}
        
        <g>
          {rooms.map((room) => ( room.visible &&
            <g key={room.id} onMouseDown={(e) => handleMouseDown(e, room)} className={tool === 'select' ? 'cursor-move' : ''}>
              <path
                d={getRoomPath(room)}
                fill="hsl(var(--primary) / 0.3)"
                stroke="hsl(var(--primary))"
                strokeWidth={selectedItem?.id === room.id ? 2 : 1}
                className="transition-all"
                data-item-id={room.id}
              />
              <text x={room.points[0].x + 10} y={room.points[0].y + 20} fill="hsl(var(--foreground))" fontSize="12" pointerEvents="none" className="select-none">
                {room.name}
              </text>
            </g>
          ))}

          {surfaces.map((surface) => ( surface.visible &&
            <line
              key={surface.id}
              x1={surface.start.x}
              y1={surface.start.y}
              x2={surface.end.x}
              y2={surface.end.y}
              stroke={surfaceColors[surface.surfaceType]}
              strokeWidth={surface.thickness}
              strokeLinecap="round"
              className={tool === 'select' ? 'cursor-pointer' : ''}
              onMouseDown={(e) => handleMouseDown(e, surface)}
            />
          ))}
          
          {furniture.map((item) => ( item.visible &&
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
                data-item-id={item.id}
              />
              <text x={item.width / 2} y={item.height / 2} textAnchor="middle" dy=".3em" fill="hsl(var(--accent-foreground))" fontSize="10" pointerEvents="none" className="select-none">
                {item.name}
              </text>
            </g>
          ))}

          {annotations.map((note) => ( note.visible &&
            <g key={note.id} onMouseDown={(e) => handleMouseDown(e, note)} className={tool === 'select' ? 'cursor-move' : ''}>
              <foreignObject x={note.x} y={note.y} width="120" height="80">
                  <div className="p-2 text-xs bg-card border rounded-md shadow-md h-full w-full overflow-hidden text-ellipsis select-none">
                    {note.text}
                  </div>
              </foreignObject>
            </g>
          ))}

          {measurements.map((line) => {
            if (!line.visible || line.isSurface) return null;
            const distance = getDistance(line.start, line.end);
            const midX = (line.start.x + line.end.x) / 2;
            const midY = (line.start.y + line.end.y) / 2;
            const angle = Math.atan2(line.end.y - line.start.y, line.end.x - line.start.x) * 180 / Math.PI;

            return (
            <g key={line.id} onMouseDown={(e) => handleMouseDown(e, line)}>
              <line
                x1={line.start.x}
                y1={line.start.y}
                x2={line.end.x}
                y2={line.end.y}
                stroke={line.isReference ? "hsl(var(--ring))" : "hsl(var(--destructive))"}
                strokeWidth={selectedItem?.id === line.id ? 3 : 2}
                strokeDasharray="5,5"
                className='cursor-pointer'
              />
              <circle cx={line.start.x} cy={line.start.y} r="4" fill={line.isReference ? "hsl(var(--ring))" : "hsl(var(--destructive))"} />
              <circle cx={line.end.x} cy={line.end.y} r="4" fill={line.isReference ? "hsl(var(--ring))" : "hsl(var(--destructive))"} />
              <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
                  <text 
                      y={-8}
                      textAnchor="middle"
                      fill={line.isReference ? "hsl(var(--ring))" : "hsl(var(--destructive-foreground))"}
                      fontSize="12"
                      paintOrder="stroke"
                      stroke="hsl(var(--background))"
                      strokeWidth="3px"
                      strokeLinecap="butt"
                      strokeLinejoin="miter"
                      className="font-semibold select-none"
                  >
                      {formatDistance(distance, scale, line.isReference ? line.realLength : undefined)}
                  </text>
              </g>
            </g>
          )})}
          {selectedItem?.type === 'room' && renderResizeHandles(selectedItem as Room)}
          {selectedItem?.type === 'room' && (isResizing || selectedItem) && renderRoomDimensions(selectedItem as Room)}

        </g>
      </svg>
    </div>
  );
}

    