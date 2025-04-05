import { Direction, type FloorState, type TowerState, type WordPlacement } from "./types";
import { getWordPositions, pointsEqual } from "./utils";

export class TowerScorer {
  /**
   * Оценивает баллы башни по правилам игры
   */
  public evaluateTower(tower: TowerState): {
    isValid: boolean;
    score: number;
    floors: { floorZ: number; score: number; isValid: boolean }[];
    invalidReason?: string;
  } {
    // Хотя бы 2 этажа
    if (tower.floors.size < 2) {
      return {
        isValid: false,
        score: 0,
        floors: [],
        invalidReason: "Tower must have at least 2 floors",
      };
    }

    let isValid = true;
    let totalScore = 0;
    const floorsData: { floorZ: number; score: number; isValid: boolean }[] = [];
    let invalidReason: string | undefined;

    // Валидация вертикальных слов
    const verticalWords = tower.words.filter((w) => w.direction === Direction.Z);
    for (const word of verticalWords) {
      const isWordValid = this.validateVerticalWord(word, tower);
      if (!isWordValid.valid) {
        isValid = false;
        invalidReason = isWordValid.reason;
        break;
      }
    }

    // Валидация горизонтальных слов (кроме 0 этажа)
    if (isValid) {
      const horizontalWords = tower.words.filter((w) => w.direction !== Direction.Z && w.position.z !== 0);

      for (const word of horizontalWords) {
        const isWordValid = this.validateHorizontalWord(word, tower);
        if (!isWordValid.valid) {
          isValid = false;
          invalidReason = isWordValid.reason;
          break;
        }
      }
    }

    if (isValid) {
      // Посчитать баллы
      const floorZs = Array.from(tower.floors.keys()).sort((a, b) => b - a);

      for (const z of floorZs) {
        const floor = tower.floors.get(z)!;
        const floorScore = this.calculateFloorScore(floor);
        floorsData.push({
          floorZ: z,
          score: floorScore,
          isValid: true,
        });
        totalScore += floorScore;
      }
    }

    return {
      isValid,
      score: isValid ? totalScore : 0,
      floors: floorsData,
      invalidReason,
    };
  }

  /**
   * Валидация вертикальных слов
   */
  private validateVerticalWord(word: WordPlacement, tower: TowerState) {
    let validIntersections = 0;
    const wordPositions = getWordPositions(word.word, word.position, Direction.Z);

    // Должно пересекаться как минимум с 2 горизонтальными словами не в первой букве
    const horizontalWords = tower.words.filter((w) => w.direction !== Direction.Z);

    for (const hWord of horizontalWords) {
      const hWordPositions = getWordPositions(hWord.word, hWord.position, hWord.direction);

      for (let i = 1; i < wordPositions.length; i++) {
        // Skip first letter
        const pos = wordPositions[i];
        const intersects = hWordPositions.some((p) => pointsEqual(p, pos));

        if (intersects) {
          validIntersections++;
          break;
        }
      }
    }

    if (validIntersections < 2) {
      return {
        valid: false,
        reason: `Vertical word "${word.word}" has only ${validIntersections} valid intersections, needs at least 2`,
      };
    }

    return { valid: true };
  }

  /**
   * Валидация горизонтального слова по правилам игры
   */
  private validateHorizontalWord(word: WordPlacement, tower: TowerState) {
    // Если 0 этаж, то пропускаем
    if (word.position.z === 0) {
      return { valid: true };
    }

    let validIntersections = 0;
    const wordPositions = getWordPositions(word.word, word.position, word.direction);

    // Должно пересекаться как минимум с 2 вертикальными словами не в первой букве
    const verticalWords = tower.words.filter((w) => w.direction === Direction.Z);

    for (const vWord of verticalWords) {
      const vWordPositions = getWordPositions(vWord.word, vWord.position, Direction.Z);

      for (let i = 1; i < wordPositions.length; i++) {
        const pos = wordPositions[i];
        const intersects = vWordPositions.some((p) => pointsEqual(p, pos));

        if (intersects) {
          validIntersections++;
          break;
        }
      }
    }

    if (validIntersections < 2) {
      return {
        valid: false,
        reason: `Horizontal word "${word.word}" at Z=${word.position.z} has only ${validIntersections} valid intersections, needs at least 2`,
      };
    }

    return { valid: true };
  }

  /**
   * Расчет баллов для этажа
   */
  private calculateFloorScore(floor: FloorState) {
    // Подсчет букв
    const letterCount = floor.words.reduce((sum, word) => sum + word.word.length, 0);

    // Подсчет коэффициента пропорции
    const proportionCoefficient = Math.min(floor.width, floor.depth) / Math.max(floor.width, floor.depth);

    // Подсчет коэффициента плотности
    const xWordsCount = floor.horizontalWords.filter((w) => w.direction === Direction.X).length;
    const yWordsCount = floor.horizontalWords.filter((w) => w.direction === Direction.Y).length;
    const densityCoefficient = 1 + (xWordsCount + yWordsCount) / 4;

    // Множитель этажа
    const floorMultiplier = Math.abs(floor.z) + 1;

    // Итоговый результат
    const floorScore = letterCount * proportionCoefficient * densityCoefficient * floorMultiplier;

    return floorScore;
  }

  /**
   * Создает структуру башни (этажи, слова)
   */
  public createTowerState(wordPlacements: WordPlacement[]) {
    const tower: TowerState = {
      words: wordPlacements,
      floors: new Map<number, FloorState>(),
      score: 0,
    };

    // Группировка по Z
    const wordsByZ = new Map<number, WordPlacement[]>();
    for (const word of wordPlacements) {
      const z = word.position.z;
      if (!wordsByZ.has(z)) {
        wordsByZ.set(z, []);
      }
      wordsByZ.get(z)!.push(word);
    }

    for (const [z, floorWords] of wordsByZ) {
      const horizontalWords = floorWords.filter((w) => w.direction !== Direction.Z);
      const verticalWords = floorWords.filter((w) => w.direction === Direction.Z);

      let minX = Number.POSITIVE_INFINITY,
        maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY,
        maxY = Number.NEGATIVE_INFINITY;

      for (const word of floorWords) {
        const positions = getWordPositions(word.word, word.position, word.direction);

        for (const pos of positions) {
          minX = Math.min(minX, pos.x);
          maxX = Math.max(maxX, pos.x);
          minY = Math.min(minY, pos.y);
          maxY = Math.max(maxY, pos.y);
        }
      }

      const width = maxX - minX + 1;
      const depth = maxY - minY + 1;

      const floor: FloorState = {
        z,
        words: floorWords,
        horizontalWords: horizontalWords,
        verticalWords: verticalWords,
        width,
        depth,
        score: 0,
      };

      tower.floors.set(z, floor);
    }

    return tower;
  }
}
