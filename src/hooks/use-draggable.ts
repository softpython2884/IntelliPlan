"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Use a ref for panning state to avoid re-renders on mousemove
  const panState = useRef({
    isPanning: false,
    startPoint: { x: 0, y: 0 }
  });

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

    // Middle mouse button (button === 1) or pan tool always initiates panning
    if (e.button === 1 || tool === 'pan') {
        e.preventDefault(); 
        panState.current.isPanning = true;
        panState.current.startPoint = getClientPoint(e);
        return;
    }

    if (item && tool === 'select') {
        onSelectItem(item);
        
        if (item.type === 'measurement' || item.type === 'surface' || item.type === 'wiring') {
           return;
        }

        const point = getSVGPoint(e);
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
    if (draggingItem && tool === 'select' && selectedItem) {
      const point = getSVGPoint(e);
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
    } else if (panState.current.isPanning && svgRef.current) {
        const clientPoint = getClientPoint(e);
        const scale = viewBox.width / svgRef.current.clientWidth;

        const dx = (clientPoint.x - panState.current.startPoint.x) * scale;
        const dy = (clientPoint.y - panState.current.startPoint.y) * scale;
        
        panState.current.startPoint = clientPoint;

        setViewBox(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    setDraggingItem(null);
    panState.current.isPanning = false;
  };
  
  useEffect(() => {
    // We attach to window to catch mouse events outside the SVG
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [draggingItem, selectedItem, onUpdateItem, setViewBox, viewBox.width]); // Keep dependencies minimal but correct


  return { handleMouseDown };
}
