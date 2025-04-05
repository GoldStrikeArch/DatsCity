import fs from "node:fs";
import { CONFIG } from "./config";
import { Coord3D, Direction, WordCommand } from "./core";
import { WorldGrid3D } from "./generation";
import type { model_PlayerBuildRequest } from "./generated/models/model_PlayerBuildRequest";
import type { model_TowerWordRequest } from "./generated/models/model_TowerWordRequest";
import type { model_PlayerExtendedWordsResponse } from "./generated/models/model_PlayerExtendedWordsResponse";
import { ApiClient } from "./apiClient";

export class GameClient {
  private logs: any[] = [];
  private words: string[] = [];
  private mapSize: number[] = [];
  private shuffleLeft: number = 0;
  private apiClient: ApiClient;

  constructor() {
    this.logs = [];
    this.apiClient = new ApiClient();
  }

  /**
   * Get words from the API
   */
  async getWords(): Promise<model_PlayerExtendedWordsResponse> {
    try {
      const response = await this.apiClient.getWords();

      this.words = response.words || [];
      this.mapSize = response.mapSize || [30, 30, 100];
      this.shuffleLeft = response.shuffleLeft || 0;

      console.log(`Received ${this.words.length} words. Shuffles left: ${this.shuffleLeft}`);
      console.log(`Map size: ${this.mapSize.join(" x ")}`);
      console.log(`Turn: ${response.turn}, Next turn in: ${response.nextTurnSec}s`);
      console.log(`Round ends at: ${response.roundEndsAt}`);

      return response;
    } catch (error) {
      console.error("Failed to get words:", error.message);
      throw error;
    }
  }

  /**
   * Build a tower using the SimpleTowerBuilder
   */
  async buildTower(maxFloors: number = 5): Promise<boolean> {
    try {
      if (this.words.length === 0) {
        await this.getWords();
      }

      // Create a 3D grid for the tower
      const grid = new WorldGrid3D(
        this.mapSize[0], // width
        this.mapSize[1], // height
        this.mapSize[2], // depth
        this.words
      );

      // Sort words by length (longest first) for better tower building
      const sortedWordIndices = this.words
        .map((word, index) => ({ word, index }))
        .sort((a, b) => b.word.length - a.word.length)
        .map(item => item.index);

      // Find the longest word to determine maximum possible floors
      const longestWordLength = sortedWordIndices.length > 0 ?
        this.words[sortedWordIndices[0]].length : 0;

      // Limit maxFloors based on the longest available word
      // The longest vertical word determines how deep we can go
      const possibleFloors = Math.min(maxFloors, longestWordLength - 1);
      console.log(`Longest word is ${longestWordLength} characters, can build up to ${possibleFloors} floors`);

      // Further limit based on map bounds
      const mapBoundFloors = Math.min(possibleFloors, this.mapSize[2] - 1);

      // Based on the error message, we can't go below Z=-17
      const maxAllowedLength = 17; // Maximum allowed word length for vertical words
      const maxAllowedFloors = maxAllowedLength - 1; // Maximum floors we can build

      const finalMaxFloors = Math.min(mapBoundFloors, maxAllowedFloors);
      console.log(`Map Z bound is ${this.mapSize[2]}, max allowed Z is -17, limiting to ${finalMaxFloors} floors`);

      // Build a simple tower with minimum words to reach the desired height
      const towerCommands = this.buildSimpleTower(grid, sortedWordIndices, finalMaxFloors);

      if (towerCommands.length === 0) {
        console.error("Failed to build tower");
        return false;
      }

      // Convert commands to API request format
      const buildRequest: model_PlayerBuildRequest = {
        words: towerCommands.map(cmd => this.convertToTowerWordRequest(cmd)),
        done: true // Mark the tower as complete
      };

      console.log(`Sending build request with ${buildRequest.words.length} words...`);
      console.log(`First few words: ${buildRequest.words.slice(0, 3).map(w =>
        `ID:${w.id}, Dir:${w.dir}, Pos:[${w.pos?.join(',')}]`).join(', ')}`);

      // Log the complete request payload
      console.log('Complete request payload:');
      console.log(JSON.stringify(buildRequest, null, 2));

      // Send the build request
      const response = await this.apiClient.buildTower(buildRequest);

      console.log(`Tower built successfully with ${towerCommands.length} words`);
      console.log(`Shuffles left: ${response.shuffleLeft}`);

      return true;
    } catch (error) {
      console.error("Failed to build tower:", error.message);
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
      }
      return false;
    }
  }



  /**
   * Find pairs of words that can intersect (have common letters)
   */
  private findIntersectingWordPairs(wordIndices: number[]): Array<{
    word1Index: number;
    word2Index: number;
    positions: Array<{ pos1: number; pos2: number; letter: string }>;
  }> {
    const pairs: Array<{
      word1Index: number;
      word2Index: number;
      positions: Array<{ pos1: number; pos2: number; letter: string }>;
    }> = [];

    for (let i = 0; i < wordIndices.length; i++) {
      const word1Index = wordIndices[i];
      const word1 = this.words[word1Index];

      for (let j = i + 1; j < wordIndices.length; j++) {
        const word2Index = wordIndices[j];
        const word2 = this.words[word2Index];

        const positions: Array<{ pos1: number; pos2: number; letter: string }> = [];

        // Find all common letters
        for (let pos1 = 0; pos1 < word1.length; pos1++) {
          const letter = word1[pos1];

          for (let pos2 = 0; pos2 < word2.length; pos2++) {
            if (word2[pos2] === letter) {
              positions.push({ pos1, pos2, letter });
            }
          }
        }

        if (positions.length > 0) {
          pairs.push({ word1Index, word2Index, positions });
        }
      }
    }

    return pairs;
  }

  /**
   * Find words that contain a specific letter
   */
  private findWordsWithLetter(wordIndices: number[], usedIndices: Set<number>, letter: string): number[] {
    const result: number[] = [];

    for (const index of wordIndices) {
      if (!usedIndices.has(index) && this.words[index].includes(letter)) {
        result.push(index);
      }
    }

    return result;
  }

  /**
   * Find a suitable word of minimum length from the available words
   */
  private findSuitableWord(wordIndices: number[], minLength: number, usedIndices: Set<number>): number {
    for (const index of wordIndices) {
      if (!usedIndices.has(index) && this.words[index].length >= minLength) {
        return index;
      }
    }
    return -1;
  }

  /**
   * Convert a WordCommand to a TowerWordRequest for the API
   */
  private convertToTowerWordRequest(command: WordCommand): model_TowerWordRequest {
    return {
      id: command.id,
      dir: command.direction,
      pos: [command.coord.x, command.coord.y, command.coord.z],
    };
  }

  /**
   * Process logs
   */
  processLogs(response: any) {
    this.logs.push(response);
    if (this.logs.length >= CONFIG.LOGS_LIMIT) {
      this.flushLogs();
    }
  }

  /**
   * Flush logs to file
   */
  flushLogs() {
    if (this.logs.length === 0) return;

    const logFile = `logs/log${Date.now()}.txt`;

    fs.writeFileSync(logFile, this.logs.join("\n"));
    this.logs = [];
  }
}
