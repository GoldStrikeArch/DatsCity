import { type Coord3D, Direction, type WordCommand } from "./core";

type WorldMatrix3D = string[][][];

export class WorldGrid3D {
  public matrix: WorldMatrix3D;
  public readonly blockerSymbol = "#";
  private avalableLetters: Array<string> = [];
  private buildCommands: Array<WordCommand> = [];
  private wordPositions: Array<{ command: WordCommand; length: number }> = [];

  constructor(
    private width: number,
    private height: number,
    private depth: number,
    avalableLetters: Array<string>,
  ) {
    // Инициализация трёхмерного массива
    this.matrix = Array.from({ length: width }, () =>
      Array.from({ length: height }, () => Array.from({ length: depth }, () => "")),
    );

    this.avalableLetters = avalableLetters;
  }

  /**
   * Проверяет минимальное расстояние до других слов
   */
  private checkMinDistance(command: WordCommand, minDistance: number): boolean {
    const word = this.avalableLetters[command.id];

    for (let i = 0; i < word.length; i++) {
      const currentPos: Coord3D = { ...command.coord };

      switch (command.direction) {
        case Direction.HorizontalX:
          currentPos.x += i;
          break;
        case Direction.HorizontalY:
          currentPos.y += i;
          break;
        case Direction.Vertical:
          currentPos.z += i;
          break;
      }

      for (const { command: existingCommand, length } of this.wordPositions) {
        if (!this.checkDistanceBetweenPositions(currentPos, existingCommand, length, minDistance)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Проверяет расстояние между позицией и существующим словом
   */
  private checkDistanceBetweenPositions(
    pos: Coord3D,
    existingCommand: WordCommand,
    existingLength: number,
    minDistance: number,
  ): boolean {
    for (let i = 0; i < existingLength; i++) {
      const existingPos: Coord3D = { ...existingCommand.coord };

      switch (existingCommand.direction) {
        case Direction.HorizontalX:
          existingPos.x += i;
          break;
        case Direction.HorizontalY:
          existingPos.y += i;
          break;
        case Direction.Vertical:
          existingPos.z += i;
          break;
      }

      // Если это пересечение с одинаковой буквой - пропускаем
      if (this.isSamePosition(pos, existingPos)) {
        const currentChar = this.matrix[pos.x]?.[pos.y]?.[pos.z];
        const existingChar = this.avalableLetters[existingCommand.id][i];
        if (currentChar === existingChar) {
          continue;
        }
      }

      // Вычисляем максимальное расстояние по осям
      const distance = Math.max(
        Math.abs(existingPos.x - pos.x),
        Math.abs(existingPos.y - pos.y),
        Math.abs(existingPos.z - pos.z),
      );

      if (distance < minDistance) {
        return false;
      }
    }

    return true;
  }

  /**
   * Проверяет, что две позиции идентичны
   */
  private isSamePosition(a: Coord3D, b: Coord3D): boolean {
    return a.x === b.x && a.y === b.y && a.z === b.z;
  }

  public insertWord(command: WordCommand): void {
    const word = this.avalableLetters[command.id];
    for (let i = 0; i < word.length; i++) {
      switch (command.direction) {
        case Direction.HorizontalX:
          this.matrix[command.coord.x + i][command.coord.y][command.coord.z] = word[i];
          this.buildCommands.push(command);
          break;
        case Direction.HorizontalY:
          this.matrix[command.coord.x][command.coord.y + i][command.coord.z] = word[i];
          this.buildCommands.push(command);
          break;
        case Direction.Vertical:
          this.matrix[command.coord.x][command.coord.y][command.coord.z + i] = word[i];
          this.buildCommands.push(command);
          break;
      }
    }
  }

  private tryInsertWord(command: WordCommand): boolean {
    const word = this.avalableLetters[command.id];

    if (!this.canFitWord(command)) return false;
    if (!this.checkWordCollision(command)) return false;

    this.insertWord(command);
    return true;
  }

  /**
   * Может ли поместиться слово в матрицу
   */
  private canFitWord(command: WordCommand): boolean {
    const wordLen = this.avalableLetters[command.id].length;
    switch (command.direction) {
      case Direction.HorizontalX:
        return command.coord.x + wordLen <= this.width;
      case Direction.HorizontalY:
        return command.coord.y + wordLen <= this.height;
      case Direction.Vertical:
        return command.coord.z + wordLen <= this.depth;
      default:
        return false;
    }
  }

  /**
   * Проверяет коллизию при вставке слова
   * @param command
   * @returns
   */
  private checkWordCollision(command: WordCommand): boolean {
    const word = this.avalableLetters[command.id];

    for (let i = 0; i < word.length; i++) {
      let currentX = command.coord.x;
      let currentY = command.coord.y;
      let currentZ = command.coord.z;

      // Вычисляем текущую позицию в зависимости от направления
      switch (command.direction) {
        case Direction.HorizontalX:
          currentX += i;
          break;
        case Direction.HorizontalY:
          currentY += i;
          break;
        case Direction.Vertical:
          currentZ += i;
          break;
      }

      const currentChar = this.matrix[currentX]?.[currentY]?.[currentZ];

      if (currentChar === this.blockerSymbol || (currentChar && currentChar !== word[i])) {
        return false;
      }
    }

    return true;
  }

  public setBlocker(coord: Coord3D): void {
    if (this.isValidPosition(coord.x, coord.y, coord.z)) {
      this.matrix[coord.x][coord.y][coord.z] = this.blockerSymbol;
    }
  }

  private isValidPosition(x: number, y: number, z: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height && z >= 0 && z < this.depth;
  }

  /**
   * Возвращает список всех команд вставки
   */
  public getBuildCommands(): Array<WordCommand> {
    return [...this.buildCommands];
  }
}
