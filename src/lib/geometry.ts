import type { Point } from './types';

export function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function formatDistance(pixelDistance: number, scale: { pixels: number, meters: number }, realLengthCm?: number): string {
    if (realLengthCm !== undefined) {
      if (realLengthCm < 100) {
        return `${realLengthCm.toFixed(1)} cm`;
      }
      return `${(realLengthCm / 100).toFixed(2)} m`;
    }

    if (!scale || scale.pixels === 0 || !scale.meters) return `${pixelDistance.toFixed(0)}px`;
    
    const meters = (pixelDistance / scale.pixels) * scale.meters;

    if (meters < 1) {
      return `${(meters * 100).toFixed(1)} cm`;
    }
    return `${meters.toFixed(2)} m`;
}

export function getPolygonCentroid(points: Point[]): Point {
    let centroid: Point = { x: 0, y: 0 };
    
    if (points.length === 0) return centroid;

    let signedArea = 0;
    let x0 = 0;
    let y0 = 0;
    let x1 = 0;
    let y1 = 0;
    let a = 0;

    // For a simple average if the polygon is not closed
    if (points.length > 0 && (points[0].x !== points[points.length -1]?.x || points[0].y !== points[points.length-1]?.y)) {
       for (const p of points) {
        centroid.x += p.x;
        centroid.y += p.y;
      }
      centroid.x /= points.length;
      centroid.y /= points.length;
      return centroid;
    }

    // For closed polygon
    for (let i = 0; i < points.length -1; ++i) {
        x0 = points[i].x;
        y0 = points[i].y;
        x1 = points[i+1].x;
        y1 = points[i+1].y;
        a = x0 * y1 - x1 * y0;
        signedArea += a;
        centroid.x += (x0 + x1) * a;
        centroid.y += (y0 + y1) * a;
    }

    signedArea *= 0.5;
    centroid.x /= (6.0*signedArea);
    centroid.y /= (6.0*signedArea);

    return centroid;
}


export function getPolygonBounds(points: Point[]) {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = points[0].x;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    if (points[i].x < minX) minX = points[i].x;
    if (points[i].x > maxX) maxX = points[i].x;
    if (points[i].y < minY) minY = points[i].y;
    if (points[i].y > maxY) maxY = points[i].y;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}
