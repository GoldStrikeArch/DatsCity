/**
 * Суть алгоритма заключается в построении плотной структуры в самой высшей точке мира. Для опоры строится отросток из слов.
 *
 * >Верхние этажи дают большой множитель. Так как баллы за этаж умножаются на номер этажа.
 * Имеет смысл уплотнять только самые верхние этажи, чтобы не тратить слова на нижние этажи которые дают меньший множитель.
 * Если ширина и глубина мира не слишком большие - можно занимать все доступное пространство, ведь нам дается балы за плотность,
 * т.е. за количество слов по X,Y.
 *
 * По пунктам:
 * 1. Получаем список слов
 * 2. Сортируем их по длине. (Длинные слова лучше расположить на верхних этажах.)
 * 3. Строим отросток от дна до самой верней точки мира.
 * 4. Создаем уплотненную структуру в самой верхней точке мира.
 */

/**
 * Направление слова.
 * Соответствует значениям из API.
 */
export enum Direction {
  Vertical = 1, // Ось Z (имеется в виду вертикальная ось)
  HorizontalX = 2, // Горизонтально слева направо. Ось X
  HorizontalY = 3, // Горизонтально. Ось Y
}

/**
 * Координаты в мире.
 */
export class Coord3D {
  x: number; // Горизонтальная ось слева направо.
  y: number; // Горизонтальная ось.
  z: number; // Вертикальная ось.

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

/**
 * Команда для отправки на сервер.
 */
export class WordCommand {
  coord: Coord3D; // Координата начала.
  direction: Direction; // Направление.
  id: number; // ID слова из списка.

  constructor(id: number, coord: Coord3D, direction: Direction) {
    this.coord = coord;
    this.id = id;
    this.direction = direction;
  }
}
