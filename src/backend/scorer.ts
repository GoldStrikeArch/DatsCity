// src/backend/scorer.ts
import { Direction, FloorState, Point3D, TowerState, WordPlacement } from './types';
import { getWordPositions, pointsEqual } from './utils';

export class TowerScorer {
  /**
   * Evaluates a tower's score based on the game rules
   */
  public evaluateTower(tower: TowerState): {
    isValid: boolean;
    score: number;
    floors: { floorZ: number, score: number, isValid: boolean }[];
    invalidReason?: string;
  } {
    // Check if tower has at least 2 floors
    if (tower.floors.size < 2) {
      return {
        isValid: false,
        score: 0,
        floors: [],
        invalidReason: "Tower must have at least 2 floors"
      };
    }

    let isValid = true;
    let totalScore = 0;
    let floorsData: { floorZ: number, score: number, isValid: boolean }[] = [];
    let invalidReason: string | undefined;

    // Validate vertical words
    const verticalWords = tower.words.filter(w => w.direction === Direction.Z);
    for (const word of verticalWords) {
      const isWordValid = this.validateVerticalWord(word, tower);
      if (!isWordValid.valid) {
        isValid = false;
        invalidReason = isWordValid.reason;
        break;
      }
    }

    // Validate horizontal words (except on Z=0)
    if (isValid) {
      const horizontalWords = tower.words.filter(w =>
        w.direction !== Direction.Z && w.position.z !== 0);

      for (const word of horizontalWords) {
        const isWordValid = this.validateHorizontalWord(word, tower);
        if (!isWordValid.valid) {
          isValid = false;
          invalidReason = isWordValid.reason;
          break;
        }
      }
    }

    // If tower is valid, calculate score
    if (isValid) {
      // Calculate score for each floor
      const floorZs = Array.from(tower.floors.keys()).sort((a, b) => b - a);

      for (const z of floorZs) {
        const floor = tower.floors.get(z)!;
        const floorScore = this.calculateFloorScore(floor);
        floorsData.push({
          floorZ: z,
          score: floorScore,
          isValid: true
        });
        totalScore += floorScore;
      }
    }

    return {
      isValid,
      score: isValid ? totalScore : 0,
      floors: floorsData,
      invalidReason
    };
  }

  /**
   * Validates a vertical word according to game rules
   */
  private validateVerticalWord(word: WordPlacement, tower: TowerState): { valid: boolean; reason?: string } {
    let validIntersections = 0;
    const wordPositions = getWordPositions(word.word, word.position, Direction.Z);

    // Must intersect with at least 2 horizontal words not in the first letter
    const horizontalWords = tower.words.filter(w => w.direction !== Direction.Z);

    for (const hWord of horizontalWords) {
      const hWordPositions = getWordPositions(hWord.word, hWord.position, hWord.direction);

      for (let i = 1; i < wordPositions.length; i++) {  // Skip first letter
        const pos = wordPositions[i];
        const intersects = hWordPositions.some(p => pointsEqual(p, pos));

        if (intersects) {
          validIntersections++;
          break;  // One intersection per horizontal word
        }
      }
    }

    if (validIntersections < 2) {
      return {
        valid: false,
        reason: `Vertical word "${word.word}" has only ${validIntersections} valid intersections, needs at least 2`
      };
    }

    return { valid: true };
  }

  /**
   * Validates a horizontal word according to game rules
   */
  private validateHorizontalWord(word: WordPlacement, tower: TowerState): { valid: boolean; reason?: string } {
    // If word is on Z=0 floor, no validation needed
    if (word.position.z === 0) {
      return { valid: true };
    }

    let validIntersections = 0;
    const wordPositions = getWordPositions(word.word, word.position, word.direction);

    // Must intersect with at least 2 vertical words not in the first letter
    const verticalWords = tower.words.filter(w => w.direction === Direction.Z);

    for (const vWord of verticalWords) {
      const vWordPositions = getWordPositions(vWord.word, vWord.position, Direction.Z);

      for (let i = 1; i < wordPositions.length; i++) {  // Skip first letter
        const pos = wordPositions[i];
        const intersects = vWordPositions.some(p => pointsEqual(p, pos));

        if (intersects) {
          validIntersections++;
          break;  // One intersection per vertical word
        }
      }
    }

    if (validIntersections < 2) {
      return {
        valid: false,
        reason: `Horizontal word "${word.word}" at Z=${word.position.z} has only ${validIntersections} valid intersections, needs at least 2`
      };
    }

    return { valid: true };
  }

  /**
   * Calculates score for a floor
   */
  private calculateFloorScore(floor: FloorState): number {
    // Total letters count on the floor
    const letterCount = floor.words.reduce((sum, word) => sum + word.word.length, 0);

    // Calculate proportion coefficient
    const proportionCoefficient = Math.min(floor.width, floor.depth) / Math.max(floor.width, floor.depth);

    // Calculate density coefficient
    const xWordsCount = floor.horizontalWords.filter(w => w.direction === Direction.X).length;
    const yWordsCount = floor.horizontalWords.filter(w => w.direction === Direction.Y).length;
    const densityCoefficient = 1 + (xWordsCount + yWordsCount) / 4;

    // Calculate floor multiplier (height bonus)
    const floorMultiplier = Math.abs(floor.z) + 1;

    // Final score for the floor
    const floorScore = letterCount * proportionCoefficient * densityCoefficient * floorMultiplier;

    return floorScore;
  }

  /**
   * Creates a TowerState from a list of words and coordinates
   */
  public createTowerState(wordPlacements: WordPlacement[]): TowerState {
    const tower: TowerState = {
      words: wordPlacements,
      floors: new Map<number, FloorState>(),
      score: 0
    };

    // Group words by z-coordinate
    const wordsByZ = new Map<number, WordPlacement[]>();
    for (const word of wordPlacements) {
      const z = word.position.z;
      if (!wordsByZ.has(z)) {
        wordsByZ.set(z, []);
      }
      wordsByZ.get(z)!.push(word);
    }

    // Create floor states
    for (const [z, floorWords] of wordsByZ) {
      const horizontalWords = floorWords.filter(w => w.direction !== Direction.Z);
      const verticalWords = floorWords.filter(w => w.direction === Direction.Z);

      // Determine floor dimensions
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

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

      // Create floor state
      const floor: FloorState = {
        z,
        words: floorWords,
        horizontalWords: horizontalWords,
        verticalWords: verticalWords,
        width,
        depth,
        score: 0 // Will be calculated later
      };

      tower.floors.set(z, floor);
    }

    return tower;
  }
}
