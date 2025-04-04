import { Direction, type Point3D } from "./types";

/**
/**
 * Проверить, равны ли две точки
 */
export function pointsEqual(p1: Point3D, p2: Point3D): boolean {
  return p1.x === p2.x && p1.y === p2.y && p1.z === p2.z;
}

/**
 * Получить все позиции, занимаемые словом
 */
export function getWordPositions(word: string, position: Point3D, direction: Direction): Point3D[] {
  const positions: Point3D[] = [];

  for (let i = 0; i < word.length; i++) {
    let pos: Point3D;

    if (direction === Direction.X) {
      pos = { x: position.x + i, y: position.y, z: position.z };
    } else if (direction === Direction.Y) {
      pos = { x: position.x, y: position.y + i, z: position.z };
    } else {
      // Direction.Z
      pos = { x: position.x, y: position.y, z: position.z - i };
    }

    positions.push(pos);
  }

  return positions;
}

/**
 * Вычислить коэффициент пропорции для этажа
 * min(width, depth) / max(width, depth)
 */
export function calculateProportionCoefficient(width: number, depth: number): number {
  return Math.min(width, depth) / Math.max(width, depth);
}

/**
 * Вычислить коэффициент плотности для этажа
 * 1 + (X words + Y words) / 4
 */
export function calculateDensityCoefficient(xWords: number, yWords: number): number {
  return 1 + (xWords + yWords) / 4;
}

/**
 * Вычислить множитель этажа
 * |z| + 1
 */
export function calculateFloorMultiplier(z: number): number {
  return Math.abs(z) + 1;
}
