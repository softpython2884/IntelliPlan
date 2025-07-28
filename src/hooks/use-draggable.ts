"use client";

import { useState, useEffect } from 'react';
import type { Room, Furniture, Annotation, Point, Measurement } from '@/lib/types';

interface DraggableOptions {
  svgRef: React.RefObject<SVGSVGElement>;
  tool: string;
  onSelectItem: (item: Room | Furniture | Annotation | Measurement | null) => void;
  onUpdateItem: (item: Room | Furniture | Annotation | Measurement) => void;
  viewBox: { x: number, y: number, width: number, height: number };
  setViewBox: React.Dispatch<React.SetStateAction<{ x: number, y: number, width: number, height: number }>>;
  setTool: (tool: string) => void;
  selectedItem: Room | Furniture | Annotation | Measurement | null;
}

export function useDraggable({ svgRef, tool, onSelectItem, onUpdateItem, viewBox, setViewBox, setTool, selectedItem }: DraggableOptions) {
  const [draggingItem, setDraggingItem] = useState<{ item: Room | Furniture | Annotation | Measurement; offset: Point } | null>(null);
  const [panning, setPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setTool('pan');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' && tool === 'pan') {
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
      const svgPoint = pt.matrixTransform(ctm.inverse());
      return { x: svgPoint.x, y: svgPoint.y };
    }
    return { x: 0, y: 0 };
  };

  const getClientPoint = (e: React.MouseEvent | MouseEvent): Point => {
    return { x: e.clientX, y: e.clientY };
  };

  const handleMouseDown = (e: React.MouseEvent, item?: Room | Furniture | Annotation | Measurement) => {
    if (tool === 'pan') {
      e.stopPropagation();
      setPanning(true);
      setPanStart(getClientPoint(e));
      return;
    }
    if (item && (tool === 'select' || tool === 'measure')) {
        e.stopPropagation();
        onSelectItem(item);
        if (tool === 'select') {
          const point = getSVGPoint(e);
          let itemPosition: Point;
          if (item.type === 'measurement') {
            // Can't drag measurements for now.
             return;
          } else {
            itemPosition = { x: item.x, y: item.y };
          }
    
          setDraggingItem({
            item,
            offset: { x: point.x - itemPosition.x, y: point.y - itemPosition.y },
          });
        }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (draggingItem && draggingItem.item.type !== 'measurement' && tool === 'select') {
      const point = getSVGPoint(e);
      const newX = point.x - draggingItem.offset.x;
      const newY = point.y - draggingItem.offset.y;

      const updatedItem = { ...draggingItem.item, x: newX, y: newY };
      onUpdateItem(updatedItem);
      setDraggingItem(prev => prev ? { ...prev, item: updatedItem } : null);
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
    const onMove = (e: MouseEvent) => handleMouseMove(e)
    const onUp = () => handleMouseUp()
    
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
  },[draggingItem, panning, panStart])


  return { handleMouseDown };
}
