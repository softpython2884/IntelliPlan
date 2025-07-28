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
  const [isResizing, setIsResizing] = useState<string | null>(null);

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
  });

  const handleMouseDown = (e: React.MouseEvent, item?: BaseItem) => {
    e.stopPropagation();
    const point = getSVGPoint(e);
    
    if (tool === 'measure') {
      setIsMeasuring(true);
      const isFirstMeasurement = !items.some(i => i.type === 'measurement' && i.isReference);
      const newLine: Measurement = {
        id: `measure-${Date.now()}`, type: 'measurement', start: point, end: point, visible: true, isReference: isFirstMeasurement,
      };
      setItems([...items, newLine]);
    } else {
      handleDraggableMouseDown(e, item);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tool === 'measure' && isMeasuring) {
      const point = getSVGPoint(e);
      const currentLine = items.find(i => i.type === 'measurement' && (i as Measurement).end.x === (i as Measurement).start.x && (i as Measurement).end.y === (i as Measurement).start.y) as Measurement;
      if (currentLine) {
        const updatedLine = { ...currentLine, end: point };
        onUpdateItem(updatedLine);
      }
    } else if (isResizing && selectedItem?.type === 'room') {
        const room = selectedItem as Room;
        const point = getSVGPoint(e);
        let { x, y, width, height } = room;

        if (isResizing.includes('right')) {
            width = Math.max(10, point.x - x);
        }
        if (isResizing.includes('left')) {
            width = Math.max(10, width + (x - point.x));
            x = point.x;
        }
        if (isResizing.includes('bottom')) {
            height = Math.max(10, point.y - y);
        }
        if (isResizing.includes('top')) {
            height = Math.max(10, height + (y - point.y));
            y = point.y;
        }
        onUpdateItem({ ...room, x, y, width, height });
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (tool === 'measure' && isMeasuring) {
      const point = getSVGPoint(e);
      const currentLine = items.find(i => i.type === 'measurement' && (i as Measurement).end.x === (i as Measurement).end.x && (i as Measurement).end.y === (i as Measurement).end.y) as Measurement;
      if(currentLine) onSelectItem(currentLine)
      setIsMeasuring(false);
      setTool('select');
    }
    if (isResizing) {
        setIsResizing(null);
    }
  };


  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as SVGElement).tagName === 'rect' && !(e.target as SVGElement).hasAttribute('data-item-id')) {
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

  const renderResizeHandles = (room: Room) => {
    const handleSize = 8;
    const halfHandle = handleSize / 2;
    const positions = {
      'top-left': { x: room.x - halfHandle, y: room.y - halfHandle, cursor: 'nwse-resize' },
      'top-right': { x: room.x + room.width - halfHandle, y: room.y - halfHandle, cursor: 'nesw-resize' },
      'bottom-left': { x: room.x - halfHandle, y: room.y + room.height - halfHandle, cursor: 'nesw-resize' },
      'bottom-right': { x: room.x + room.width - halfHandle, y: room.y + room.height - halfHandle, cursor: 'nwse-resize' },
      'top': { x: room.x + room.width / 2 - halfHandle, y: room.y - halfHandle, cursor: 'ns-resize' },
      'bottom': { x: room.x + room.width / 2 - halfHandle, y: room.y + room.height - halfHandle, cursor: 'ns-resize' },
      'left': { x: room.x - halfHandle, y: room.y + room.height / 2 - halfHandle, cursor: 'ew-resize' },
      'right': { x: room.x + room.width - halfHandle, y: room.y + room.height / 2 - halfHandle, cursor: 'ew-resize' },
    };

    return Object.entries(positions).map(([key, pos]) => (
      <rect
        key={key}
        x={pos.x}
        y={pos.y}
        width={handleSize}
        height={handleSize}
        fill="hsl(var(--ring))"
        stroke="hsl(var(--background))"
        strokeWidth="1"
        className="cursor-pointer"
        style={{ cursor: pos.cursor }}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(key);
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

    return (<>
      <text x={room.x + room.width / 2} y={room.y - offset} {...textStyle}>
        {formatDistance(room.width, scale)}
      </text>
      <text x={room.x + room.width + offset} y={room.y + room.height / 2} transform={`rotate(90, ${room.x + room.width + offset}, ${room.y + room.height/2})`} {...textStyle}>
        {formatDistance(room.height, scale)}
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
        
        <g>
          {backgroundImage && (
             <image href={backgroundImage} x={viewBox.x} y={viewBox.y} width={viewBox.width} height={viewBox.height} style={{opacity: 0.5}} />
          )}

          {rooms.map((room) => ( room.visible &&
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
                data-item-id={room.id}
              />
              <text x={room.x + 10} y={room.y + 20} fill="hsl(var(--foreground))" fontSize="12" pointerEvents="none" className="select-none">
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
