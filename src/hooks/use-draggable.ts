"use client";

import { useState } from 'react';
import type { Room, Furniture, Annotation, Point } from '@/lib/types';

interface DraggableOptions {
  svgRef: React.RefObject<SVGSVGElement>;
  tool: string;
  onSelectItem: (item: Room | Furniture | Annotation | null) => void;
  onUpdateItem: (item: Room | Furniture | Annotation) => void;
}

export function useDraggable({ svgRef, tool, onSelectItem, onUpdateItem }: DraggableOptions) {
  const [draggingItem, setDraggingItem] = useState<{ item: Room | Furniture | Annotation; offset: Point } | null>(null);

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

  const handleMouseDown = (e: React.MouseEvent, item: Room | Furniture | Annotation) => {
    if (tool !== 'select') return;
    e.stopPropagation();
    onSelectItem(item);
    const point = getSVGPoint(e);
    setDraggingItem({
      item,
      offset: { x: point.x - item.x, y: point.y - item.y },
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingItem) return;
    const point = getSVGPoint(e);
    const newX = point.x - draggingItem.offset.x;
    const newY = point.y - draggingItem.offset.y;

    const updatedItem = { ...draggingItem.item, x: newX, y: newY };
    onUpdateItem(updatedItem);
    // Also update the dragging item state to avoid lag
    setDraggingItem(prev => prev ? { ...prev, item: updatedItem } : null);
  };

  const handleMouseUp = () => {
    setDraggingItem(null);
  };

  return { draggingItem, handleMouseDown, handleMouseMove, handleMouseUp };
}
