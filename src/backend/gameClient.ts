import fs from "node:fs";
import { ApiClient } from "./apiClient";
import { CONFIG } from "./config";
import type { WordCommand } from "./core";
import type { model_PlayerBuildRequest } from "./generated/models/model_PlayerBuildRequest";
import type { model_PlayerExtendedWordsResponse } from "./generated/models/model_PlayerExtendedWordsResponse";
import type { model_TowerWordRequest } from "./generated/models/model_TowerWordRequest";
import { SimpleTowerBuilder } from "./simpleTowerBuilder";

export class GameClient {
  private logs: any[] = [];
  private words: string[] = [];
  private mapSize: number[] = [];
  private shuffleLeft = 0;
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
  async buildTower(): Promise<boolean> {
    try {
      if (this.words.length === 0) {
        await this.getWords();
      }

      console.log(`Building a simple tower with ${this.words.length} available words`);

      // Use the SimpleTowerBuilder to create a valid tower
      const towerBuilder = new SimpleTowerBuilder(this.words);
      const towerCommands = towerBuilder.buildSimpleTower();

      if (towerCommands.length === 0) {
        console.error("Failed to build tower");
        return false;
      }

      // Convert commands to API request format
      const buildRequest: model_PlayerBuildRequest = {
        words: towerCommands.map((cmd) => this.convertToTowerWordRequest(cmd)),
        done: false,
      };

      console.log(`Sending build request with ${buildRequest.words.length} words...`);
      console.log(
        `First few words: ${buildRequest.words
          .slice(0, 3)
          .map((w) => `ID:${w.id}, Dir:${w.dir}, Pos:[${w.pos?.join(",")}]`)
          .join(", ")}`,
      );

      // Log the complete request payload
      console.log("Complete request payload:");
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
