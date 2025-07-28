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

    if (!scale || scale.pixels === 0 || !scale.meters) return `${pixelDistance.toFixed(0)}px`;
    const realDistance = (pixelDistance / scale.pixels) * scale.meters;
    
    if (realDistance < 0.01) {
        return `${(realDistance * 1000).toFixed(1)} mm`;
    }
    if (realDistance < 1) {
        return `${(realDistance * 100).toFixed(1)} cm`;
    }
    return `${realDistance.toFixed(2)} m`;
}

export function getPolygonCentroid(points: Point[]): Point {
    let centroid: Point = { x: 0, y: 0 };
    
    if (points.length === 0) return centroid;

    for (const p of points) {
        centroid.x += p.x;
        centroid.y += p.y;
    }
    centroid.x /= points.length;
    centroid.y /= points.length;
    
    return centroid;
}
