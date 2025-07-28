export interface Point {
  x: number;
  y: number;
}

export interface BaseItem {
  id: string;
  type: 'room' | 'furniture' | 'annotation';
  x: number;
  y: number;
}

export interface Room extends BaseItem {
  type: 'room';
  width: number;
  height: number;
  name: string;
}

export interface Furniture extends BaseItem {
  type: 'furniture';
  width: number;
  height: number;
  name: string;
  rotation: number;
}

export interface Annotation extends BaseItem {
  type: 'annotation';
  text: string;
}
