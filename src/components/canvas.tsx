"use client";

import { useRef, useState, useEffect } from 'react';
import type { Room, Furniture, Annotation, Point, Measurement, BaseItem, Surface } from '@/lib/types';
import { useDraggable } from '@/hooks/use-draggable';
import { cn } from '@/lib/utils';
import { getDistance, formatDistance, getPolygonCentroid } from '@/lib/geometry';

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
  onAddRoom: (room: Room) => void;
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
  onAddRoom,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 600 });
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [currentMeasurement, setCurrentMeasurement] = useState<Measurement | null>(null);
  const [isResizing, setIsResizing] = useState<{item: Room, pointIndex: number} | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [isDrawingRoom, setIsDrawingRoom] = useState(false);
  const [currentRoomPoints, setCurrentRoomPoints] = useState<Point[]>([]);
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);

  const zoomFactor = svgRef.current ? viewBox.width / svgRef.current.clientWidth : 1;

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
        const svgWidth = svgRef.current?.clientWidth || 800;
        const svgHeight = svgRef.current?.clientHeight || 600;
        const imgAspectRatio = img.width / img.height;
        const svgAspectRatio = svgWidth / svgHeight;

        let newWidth, newHeight;
        if (imgAspectRatio > svgAspectRatio) {
            newWidth = svgWidth;
            newHeight = newWidth / imgAspectRatio;
        } else {
            newHeight = svgHeight;
            newWidth = newHeight * imgAspectRatio;
        }
        const newX = (svgWidth - newWidth) / 2;
        const newY = (svgHeight - newHeight) / 2;
        
        setViewBox({ x: 0, y: 0, width: svgWidth, height: svgHeight });
        setImageDimensions({width: newWidth, height: newHeight, x: newX, y: newY});
      };
      img.src = backgroundImage;
    }
  }, [backgroundImage]);

  useEffect(() => {
    if (tool === 'draw-room' && !isDrawingRoom) {
      setIsDrawingRoom(true);
      setCurrentRoomPoints([]);
    } else if (tool !== 'draw-room' && isDrawingRoom) {
      // If tool changed, cancel drawing
      cancelDrawing();
    }
  }, [tool, isDrawingRoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && isDrawingRoom && currentRoomPoints.length > 2) {
            finalizeRoom();
        }
        if (e.key === 'Escape' && isDrawingRoom) {
            cancelDrawing();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawingRoom, currentRoomPoints]);
  
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

  const handleMouseDown = (e: React.MouseEvent, item?: BaseItem, pointIndex?: number) => {
    e.stopPropagation();
    const point = getSVGPoint(e);
    
    if (tool === 'measure') {
        if (!isMeasuring) {
            const isFirstMeasurement = !items.some(i => i.type === 'measurement' && i.isReference);
            const newMeasurement: Measurement = {
              id: `measure-${Date.now()}`, 
              type: 'measurement', 
              start: point, 
              end: point, 
              visible: true, 
              isReference: isFirstMeasurement,
            };
            setIsMeasuring(true);
            setCurrentMeasurement(newMeasurement);
            setItems([...items, newMeasurement]);
        } else if (currentMeasurement) {
            const finalMeasurement = { ...currentMeasurement, end: point };
            onUpdateItem(finalMeasurement);
            onSelectItem(finalMeasurement);
            setIsMeasuring(false);
            setCurrentMeasurement(null);
            setTool('select');
        }
    } else if (tool === 'select' && item?.type === 'room' && pointIndex !== undefined) {
      setIsResizing({item: item as Room, pointIndex});
    } else if (tool === 'draw-room' && isDrawingRoom) {
      if (currentRoomPoints.length > 2 && getDistance(point, currentRoomPoints[0]) < 10 * zoomFactor) {
        finalizeRoom();
      } else {
        setCurrentRoomPoints([...currentRoomPoints, point]);
      }
    } else {
      handleDraggableMouseDown(e, item);
    }
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    const point = getSVGPoint(e as React.MouseEvent);
    if (tool === 'measure' && isMeasuring && currentMeasurement) {
      const updatedMeasurement = { ...currentMeasurement, end: point };
      setCurrentMeasurement(updatedMeasurement);
      onUpdateItem(updatedMeasurement);
    } else if (isResizing) {
        const room = isResizing.item;
        const newPoints = [...room.points];
        newPoints[isResizing.pointIndex] = point;
        onUpdateItem({ ...room, points: newPoints });
    } else if (isDrawingRoom) {
      setPreviewPoint(point);
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isResizing) {
        setIsResizing(null);
    }
  };

  const finalizeRoom = () => {
    if (currentRoomPoints.length < 3) {
      cancelDrawing();
      return;
    }
    const centroid = getPolygonCentroid(currentRoomPoints);
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      type: 'room',
      points: currentRoomPoints,
      name: 'New Room',
      visible: true,
      x: centroid.x,
      y: centroid.y,
      rotation: 0
    };
    onAddRoom(newRoom);
    cancelDrawing();
  };

  const cancelDrawing = () => {
    setIsDrawingRoom(false);
    setCurrentRoomPoints([]);
    setPreviewPoint(null);
    setTool('select');
  };


  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as SVGElement).tagName === 'image' || ((e.target as SVGElement).tagName === 'rect' && !(e.target as SVGElement).hasAttribute('data-item-id'))) {
        if (!isDrawingRoom) onSelectItem(null);
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

  const getDrawingRoomPath = () => {
    if (currentRoomPoints.length === 0) return "";
    let path = currentRoomPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    if (previewPoint) {
      path += ` L ${previewPoint.x} ${previewPoint.y}`;
    }
    return path;
  };

  const renderResizeHandles = (room: Room) => {
    const handleSize = 8 * zoomFactor;
    const halfHandle = handleSize / 2;
    
    return room.points.map((p, index) => (
      <rect
        key={index}
        x={p.x - halfHandle}
        y={p.y - halfHandle}
        width={handleSize}
        height={handleSize}
        fill="hsl(var(--ring))"
        stroke="hsl(var(--background))"
        strokeWidth={1 * zoomFactor}
        className="cursor-move"
        onMouseDown={(e) => handleMouseDown(e, room, index)}
      />
    ));
  };
  
  const renderRoomDimensions = (room: Room) => {
    const offset = 15 * zoomFactor;
    const textStyle = {
      fontSize: `${Math.max(8, 12 * zoomFactor)}px`,
      fill: "hsl(var(--foreground))",
      textAnchor: "middle" as const,
      paintOrder: "stroke" as const,
      stroke: "hsl(var(--background))",
      strokeWidth:`${3 * zoomFactor}px`,
      strokeLinecap: "butt" as const,
      strokeLinejoin: "miter" as const,
      className: "font-semibold select-none"
    };

    if (room.points.length < 2) return null;

    return room.points.map((p1, i) => {
      const p2 = room.points[(i + 1) % room.points.length];
      const distance = getDistance(p1, p2);
      const midPoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
      
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const perpAngle = angle + Math.PI / 2;

      const textX = midPoint.x + offset * Math.cos(perpAngle);
      const textY = midPoint.y + offset * Math.sin(perpAngle);
      
      const textAngle = (angle * 180 / Math.PI) % 360;
      const displayAngle = (textAngle > 90 && textAngle < 270) ? textAngle + 180 : textAngle;


      return (
        <text key={i} x={textX} y={textY} {...textStyle} transform={`rotate(${displayAngle}, ${textX}, ${textY})`}>
          {formatDistance(distance, scale)}
        </text>
      )
    })
  };


  return (
    <div className="w-full h-full bg-secondary/30" onClick={handleCanvasClick} onWheel={handleWheel}>
       <svg ref={svgRef} width="100%" height="100%" viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`} className={cn("w-full h-full", {
        'cursor-grab': tool === 'pan',
        'cursor-grabbing': (tool === 'pan' && (e => e.buttons === 1)),
        'cursor-crosshair': tool === 'measure' || tool === 'draw-room',
        'cursor-default': tool !== 'pan' && tool !== 'measure',
      })}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
          </pattern>
        </defs>
        
        <g>
          <rect width="100%" height="100%" fill="url(#grid)" x={viewBox.x} y={viewBox.y} />
        
          {backgroundImage && (
              <image href={backgroundImage} x={imageDimensions.x} y={imageDimensions.y} width={imageDimensions.width} height={imageDimensions.height} style={{opacity: 0.5}} />
          )}
          
          {rooms.map((room) => ( room.visible &&
            <g key={room.id} onMouseDown={(e) => handleMouseDown(e, room)} className={tool === 'select' ? 'cursor-move' : ''}>
              <path
                d={getRoomPath(room)}
                fill={selectedItem?.id === room.id ? "hsl(var(--primary) / 0.1)" : "hsl(var(--primary) / 0.3)"}
                stroke="hsl(var(--primary))"
                strokeWidth={selectedItem?.id === room.id ? 2 * zoomFactor : 1 * zoomFactor}
                className="transition-all"
                data-item-id={room.id}
              />
              <text x={getPolygonCentroid(room.points).x} y={getPolygonCentroid(room.points).y} textAnchor='middle' dy=".3em" fill="hsl(var(--foreground))" fontSize={12 * zoomFactor} pointerEvents="none" className="select-none">
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
              strokeWidth={surface.thickness * zoomFactor}
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
                fill={selectedItem?.id === item.id ? "hsl(var(--accent) / 0.1)" : "hsl(var(--accent) / 0.6)"}
                stroke="hsl(var(--accent-foreground))"
                strokeWidth={selectedItem?.id === item.id ? 2 * zoomFactor : 1 * zoomFactor}
                rx="4"
                className="transition-all"
                data-item-id={item.id}
              />
              <text x={item.width / 2} y={item.height / 2} textAnchor="middle" dy=".3em" fill="hsl(var(--accent-foreground))" fontSize={10 * zoomFactor} pointerEvents="none" className="select-none">
                {item.name}
              </text>
            </g>
          ))}

          {annotations.map((note) => ( note.visible &&
            <g key={note.id} onMouseDown={(e) => handleMouseDown(e, note)} className={tool === 'select' ? 'cursor-move' : ''}>
              <foreignObject x={note.x} y={note.y} width="120" height="80" style={{ transform: `scale(${zoomFactor})`, transformOrigin: 'top left' }}>
                  <div className={cn("p-2 text-xs bg-card border rounded-md shadow-md h-full w-full overflow-hidden text-ellipsis select-none", { "bg-card/50": selectedItem?.id === note.id })}>
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
            const circleRadius = 4 * zoomFactor;

            return (
            <g key={line.id} onMouseDown={(e) => handleMouseDown(e, line)}>
              <line
                x1={line.start.x}
                y1={line.start.y}
                x2={line.end.x}
                y2={line.end.y}
                stroke={line.isReference ? "hsl(var(--ring))" : "hsl(var(--destructive))"}
                strokeWidth={(selectedItem?.id === line.id ? 2 : 1.5) * zoomFactor}
                strokeDasharray={`${5 * zoomFactor},${5 * zoomFactor}`}
                className='cursor-pointer'
              />
              <circle cx={line.start.x} cy={line.start.y} r={circleRadius} fill={line.isReference ? "hsl(var(--ring))" : "hsl(var(--destructive))"} />
              <circle cx={line.end.x} cy={line.end.y} r={circleRadius} fill={line.isReference ? "hsl(var(--ring))" : "hsl(var(--destructive))"} />
              <g transform={`translate(${midX}, ${midY}) rotate(${angle})`}>
                  <text 
                      y={-8 * zoomFactor}
                      textAnchor="middle"
                      fill={line.isReference ? "hsl(var(--foreground))" : "hsl(var(--destructive))"}
                      stroke={"hsl(var(--background))"}
                      strokeWidth={3 * zoomFactor}
                      paintOrder="stroke"
                      fontSize={12 * zoomFactor}
                      strokeLinecap="butt"
                      strokeLinejoin="miter"
                      className="font-semibold select-none"
                  >
                      {formatDistance(distance, scale, line.realLength)}
                  </text>
              </g>
            </g>
          )})}
          {selectedItem?.type === 'room' && renderResizeHandles(selectedItem as Room)}
          {selectedItem?.type === 'room' && (isResizing || selectedItem) && renderRoomDimensions(selectedItem as Room)}
          
          {isDrawingRoom && (
            <g>
              <polyline points={getDrawingRoomPath()} fill="none" stroke="hsl(var(--primary))" strokeWidth={2 * zoomFactor} strokeDasharray={`${5*zoomFactor},${5*zoomFactor}`} />
              {currentRoomPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={4 * zoomFactor} fill={i === 0 ? 'hsl(var(--ring))' : 'hsl(var(--primary))'} />
              ))}
            </g>
          )}

        </g>
      </svg>
    </div>
  );
}
