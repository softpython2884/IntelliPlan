import type { Point } from './types';

export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function formatDistance(pixelDistance: number, scale: { pixels: number, meters: number }, overrideMeters?: number): string {
    if (overrideMeters !== undefined) {
      if (overrideMeters < 1) {
        return `${(overrideMeters * 100).toFixed(1)} cm`;
      }
      return `${overrideMeters.toFixed(2)} m`;
    }

    if (scale.pixels === 0 || !scale.pixels) return `${pixelDistance.toFixed(0)}px`;
    const realDistance = (pixelDistance / scale.pixels) * scale.meters;
    
    if (realDistance < 1) {
        return `${(realDistance * 100).toFixed(1)} cm`;
    }
    return `${realDistance.toFixed(2)} m`;
}
