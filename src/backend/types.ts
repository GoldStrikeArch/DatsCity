export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export enum Direction {
  X = 0,
  Y = 1,
  Z = 2,
}

export interface WordPlacement {
  wordId: number;
  word: string;
  position: Point3D;
  direction: Direction;
}

export interface TowerState {
  words: WordPlacement[];
  floors: Map<number, FloorState>; // z-coordinate to floor state
  score: number;
}

export interface FloorState {
  z: number;
  words: WordPlacement[];
  horizontalWords: WordPlacement[];
  verticalWords: WordPlacement[];
  width: number; // X-axis
  depth: number; // Y-axis
  score: number;
}

export interface Intersection {
  word1: WordPlacement;
  word2: WordPlacement;
  position: Point3D;
  letter: string;
}

export interface WordCandidate {
  wordId: number;
  word: string;
  score: number; // Предполагаемые баллы
  position?: Point3D;
  direction?: Direction;
  intersections?: Intersection[];
}
