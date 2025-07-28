"use client";

import { useState, useEffect } from 'react';
import type { BaseItem, Point, Room } from '@/lib/types';

interface DraggableOptions {
  svgRef: React.RefObject<SVGSVGElement>;
  tool: string;
  onSelectItem: (item: BaseItem | null) => void;
  onUpdateItem: (item: BaseItem) => void;
  viewBox: { x: number, y: number, width: number, height: number };
  setViewBox: React.Dispatch<React.SetStateAction<{ x: number, y: number, width: number, height: number }>>;
  setTool: (tool: string) => void;
  selectedItem: BaseItem | null;
}

export function useDraggable({ svgRef, tool, onSelectItem, onUpdateItem, viewBox, setViewBox, setTool, selectedItem }: DraggableOptions) {
  const [draggingItem, setDraggingItem] = useState<{ item: BaseItem; offset: Point } | null>(null);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        if (tool !== 'pan') setTool('pan');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setTool('select');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [tool, setTool]);

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

  const getClientPoint = (e: React.MouseEvent | MouseEvent): Point => {
    return { x: e.clientX, y: e.clientY };
  };

  const handleMouseDown = (e: React.MouseEvent, item?: BaseItem) => {
    e.stopPropagation();
    if (tool === 'pan') {
      setPanning(true);
      setPanStart(getClientPoint(e));
      return;
    }
    if (item && tool === 'select') {
        onSelectItem(item);
        const point = getSVGPoint(e);
        
        // Items that are not draggable or have special dragging logic
        if (item.type === 'measurement' || item.type === 'surface') {
           return;
        }

        let itemPosition: Point;
        if (item.type === 'room') {
            itemPosition = { x: item.points[0].x, y: item.points[0].y };
        } else {
            itemPosition = { x: (item as any).x, y: (item as any).y };
        }
  
        setDraggingItem({
          item,
          offset: { x: point.x - itemPosition.x, y: point.y - itemPosition.y },
        });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    const point = getSVGPoint(e);
    if (draggingItem && tool === 'select' && selectedItem) {
      if(selectedItem.type === 'room') {
        const room = selectedItem as Room;
        const dx = point.x - draggingItem.offset.x - room.points[0].x;
        const dy = point.y - draggingItem.offset.y - room.points[0].y;
        const updatedRoom = { ...room, points: room.points.map(p => ({ x: p.x + dx, y: p.y + dy }))};
        onUpdateItem(updatedRoom);
        setDraggingItem(prev => prev ? { ...prev, item: updatedRoom } : null);
      } else if ('x' in selectedItem) {
        const newX = point.x - draggingItem.offset.x;
        const newY = point.y - draggingItem.offset.y;
        const updatedItem = { ...selectedItem, x: newX, y: newY };
        onUpdateItem(updatedItem);
        setDraggingItem(prev => prev ? { ...prev, item: updatedItem } : null);
      }
    } else if (panning && svgRef.current) {
        const clientPoint = getClientPoint(e);
        const scale = viewBox.width / svgRef.current.clientWidth;

        const dx = (clientPoint.x - panStart.x) * scale;
        const dy = (clientPoint.y - panStart.y) * scale;

        setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
        setPanStart(clientPoint);
    }
  };

  const handleMouseUp = () => {
    setDraggingItem(null);
    setPanning(false);
  };
  
  useEffect(() => {
    const onMove = (e: MouseEvent) => handleMouseMove(e);
    const onUp = () => handleMouseUp();
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
  }, [draggingItem, panning, panStart, viewBox.width, onUpdateItem, setViewBox]);


  return { handleMouseDown };
}
