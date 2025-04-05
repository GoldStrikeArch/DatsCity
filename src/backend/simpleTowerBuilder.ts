import { Coord3D, Direction, WordCommand } from "./core";
import { WorldGrid3D } from "./generation";

/**
 * A simple tower builder that creates a valid tower with minimal words
 */
export class SimpleTowerBuilder {
  private words: string[];
  private maxZDepth = 17; // Maximum Z depth based on error messages

  constructor(words: string[]) {
    this.words = words;
  }

  /**
   * Build a simple tower with just a few words
   * Creates a valid tower with proper intersections
   */
  public buildSimpleTower(): WordCommand[] {
    const commands: WordCommand[] = [];
    const usedIndices = new Set<number>();

    // Create a new grid
    const grid = new WorldGrid3D(30, 30, 100, this.words);

    console.log("Building a simple tower with proper intersections");

    // Step 1: Find a horizontal word for the base (floor 0)
    const baseWordIndex = this.findSuitableWord(5, usedIndices);
    if (baseWordIndex === -1) {
      console.error("No suitable base word found");
      return [];
    }

    const baseWord = this.words[baseWordIndex];
    console.log(`Selected base word: "${baseWord}"`);

    // Place base word at (5,5,0)
    const baseCommand = new WordCommand(
      baseWordIndex,
      new Coord3D(5, 5, 0),
      Direction.HorizontalX, // Direction 2 (X-axis)
    );

    try {
      grid.insertWord(baseCommand);
      commands.push(baseCommand);
      usedIndices.add(baseWordIndex);
      console.log(`Added base word: "${baseWord}" at [5,5,0] in X direction`);
    } catch (e) {
      console.error(`Failed to insert base word: ${e.message}`);
      return [];
    }

    // Step 2: Find a vertical word that intersects with the base word
    // Look for words that share a letter with the base word
    const verticalCandidates: Array<{ index: number; letter: string; basePos: number; vertPos: number }> = [];

    for (let i = 0; i < this.words.length; i++) {
      if (usedIndices.has(i)) continue;

      const word = this.words[i];
      if (word.length < 2 || word.length > this.maxZDepth) continue; // Skip too short or too long words

      // Find common letters
      for (let basePos = 0; basePos < baseWord.length; basePos++) {
        const letter = baseWord[basePos];

        for (let vertPos = 0; vertPos < word.length; vertPos++) {
          if (word[vertPos] === letter) {
            verticalCandidates.push({ index: i, letter, basePos, vertPos });
          }
        }
      }
    }

    if (verticalCandidates.length === 0) {
      console.error("No suitable vertical word found that intersects with the base word");
      return [];
    }

    // Sort by position in vertical word (prefer beginning)
    verticalCandidates.sort((a, b) => a.vertPos - b.vertPos);

    const vertCandidate = verticalCandidates[0];
    const vertWordIndex = vertCandidate.index;
    const vertWord = this.words[vertWordIndex];

    // Position vertical word to intersect with base word
    // X position: 5 (base start) + basePos (intersection point)
    // Y position: 5 (same as base word)
    // Z position: 0 - vertPos (to align the intersection letter)
    const vertCommand = new WordCommand(
      vertWordIndex,
      new Coord3D(5 + vertCandidate.basePos, 5, 0),
      Direction.Vertical, // Direction 1 (Z-axis)
    );

    try {
      grid.insertWord(vertCommand);
      commands.push(vertCommand);
      usedIndices.add(vertWordIndex);
      console.log(
        `Added vertical word: "${vertWord}" at [${5 + vertCandidate.basePos},5,0] intersecting at letter "${vertCandidate.letter}"`,
      );
    } catch (e) {
      console.error(`Failed to insert vertical word: ${e.message}`);
      // Continue with just the base word
    }

    // Step 3: Find a horizontal word for floor 1 that intersects with the vertical word
    if (commands.length > 1 && vertWord.length > 1) {
      const floor1Candidates: Array<{ index: number; letter: string; floor1Pos: number; vertPos: number }> = [];

      // The letter at floor 1 is at position 1 in the vertical word
      const letterAtFloor1 = vertWord[1];

      for (let i = 0; i < this.words.length; i++) {
        if (usedIndices.has(i)) continue;

        const word = this.words[i];
        if (word.length < 3) continue; // Too short

        // Find positions of the matching letter
        for (let pos = 0; pos < word.length; pos++) {
          if (word[pos] === letterAtFloor1) {
            floor1Candidates.push({ index: i, letter: letterAtFloor1, floor1Pos: pos, vertPos: 1 });
          }
        }
      }

      if (floor1Candidates.length > 0) {
        // Sort by position in horizontal word (prefer middle)
        floor1Candidates.sort((a, b) => {
          const wordA = this.words[a.index];
          const wordB = this.words[b.index];
          const distA = Math.abs(a.floor1Pos - wordA.length / 2);
          const distB = Math.abs(b.floor1Pos - wordB.length / 2);
          return distA - distB;
        });

        const floor1Candidate = floor1Candidates[0];
        const floor1WordIndex = floor1Candidate.index;
        const floor1Word = this.words[floor1WordIndex];

        // Position horizontal word to intersect with vertical word at floor 1
        // X position: (5 + vertCandidate.basePos) - floor1Candidate.floor1Pos
        // Y position: 5 (same as other words)
        // Z position: 1 (floor 1)
        const floor1Command = new WordCommand(
          floor1WordIndex,
          new Coord3D(5 + vertCandidate.basePos - floor1Candidate.floor1Pos, 5, 1),
          Direction.HorizontalX, // Direction 2 (X-axis)
        );

        try {
          grid.insertWord(floor1Command);
          commands.push(floor1Command);
          usedIndices.add(floor1WordIndex);
          console.log(
            `Added horizontal word on floor 1: "${floor1Word}" at [${5 + vertCandidate.basePos - floor1Candidate.floor1Pos},5,1] intersecting at letter "${floor1Candidate.letter}"`,
          );
        } catch (e) {
          console.log(`Could not add horizontal word on floor 1: ${e.message}`);
        }
      }
    }

    // Step 4: Add another vertical word that intersects with the base word
    if (commands.length > 0) {
      // Find another position on the base word for a second vertical word
      const vert2Candidates: Array<{ index: number; letter: string; basePos: number; vertPos: number }> = [];

      for (let i = 0; i < this.words.length; i++) {
        if (usedIndices.has(i)) continue;

        const word = this.words[i];
        if (word.length < 2 || word.length > this.maxZDepth) continue;

        // Find common letters
        for (let basePos = 0; basePos < baseWord.length; basePos++) {
          // Skip positions too close to the first vertical word
          if (vertCandidate && Math.abs(basePos - vertCandidate.basePos) < 2) continue;

          const letter = baseWord[basePos];

          for (let vertPos = 0; vertPos < word.length; vertPos++) {
            if (word[vertPos] === letter) {
              vert2Candidates.push({ index: i, letter, basePos, vertPos });
            }
          }
        }
      }

      if (vert2Candidates.length > 0) {
        // Sort by position in vertical word (prefer beginning)
        vert2Candidates.sort((a, b) => a.vertPos - b.vertPos);

        const vert2Candidate = vert2Candidates[0];
        const vert2WordIndex = vert2Candidate.index;
        const vert2Word = this.words[vert2WordIndex];

        // Position second vertical word to intersect with base word
        const vert2Command = new WordCommand(
          vert2WordIndex,
          new Coord3D(5 + vert2Candidate.basePos, 5, 0),
          Direction.Vertical, // Direction 1 (Z-axis)
        );

        try {
          grid.insertWord(vert2Command);
          commands.push(vert2Command);
          usedIndices.add(vert2WordIndex);
          console.log(
            `Added second vertical word: "${vert2Word}" at [${5 + vert2Candidate.basePos},5,0] intersecting at letter "${vert2Candidate.letter}"`,
          );
        } catch (e) {
          console.log(`Could not add second vertical word: ${e.message}`);
        }
      }
    }

    // Calculate tower height
    const towerHeight = commands.length > 1 ? 2 : 1; // If we have vertical word, we have at least 2 floors

    console.log(`Built simple tower with ${commands.length} words, reaching ${towerHeight} floors`);

    // Check if we have at least 2 floors
    if (towerHeight < 2) {
      console.error(`Tower height (${towerHeight}) is less than the minimum required (2). Cannot submit.`);
      return [];
    }

    return commands;
  }

  /**
   * Find a suitable word of minimum length
   */
  private findSuitableWord(minLength: number, usedIndices: Set<number>): number {
    for (let i = 0; i < this.words.length; i++) {
      if (!usedIndices.has(i) && this.words[i].length >= minLength) {
        return i;
      }
    }
    return -1;
  }
}
