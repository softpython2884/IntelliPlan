export interface Point {
  x: number;
  y: number;
}

export interface BaseItem {
  id: string;
  type: 'room' | 'furniture' | 'annotation' | 'measurement' | 'surface';
  visible?: boolean;
}

export interface Room extends BaseItem {
  type: 'room';
  points: Point[];
  name: string;
  // Add x, y, rotation for group transformations if needed
  x: number;
  y: number;
  rotation: number;
  width: number; // For overall dimensions
  height: number; // For overall dimensions
}

export interface Furniture extends BaseItem {
  type: 'furniture';
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  rotation: number;
}

export interface Annotation extends BaseItem {
  type: 'annotation';
  x: number;
  y: number;
  text: string;
}

export interface Measurement extends BaseItem {
    type: 'measurement';
    start: Point;
    end: Point;
    isReference?: boolean;
    realLength?: number; // in meters
    isSurface?: boolean;
}

export type SurfaceType = 'wall' | 'window' | 'door' | 'other';

export interface Surface extends BaseItem {
  type: 'surface';
  start: Point;
  end: Point;
  surfaceType: SurfaceType;
  thickness: number; // in pixels
}
