export interface Point {
  x: number;
  y: number;
}

export interface BaseItem {
  id: string;
  type: 'room' | 'furniture' | 'annotation' | 'measurement';
  visible?: boolean;
}

export interface Room extends BaseItem {
  type: 'room';
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
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
}
