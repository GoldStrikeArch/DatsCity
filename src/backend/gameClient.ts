import axios, { AxiosInstance } from 'axios'
import fs from 'node:fs'

import { CONFIG } from './config';

// Placeholder класс
export class GameClient {
  private logs: any[] = [];
  private axiosInstance: AxiosInstance;

    constructor() {
        this.logs = [];
        this.axiosInstance = axios.create({
            baseURL: CONFIG.BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'X-Auth-Token': CONFIG.TOKEN
            }
        });


    }

    async sendMove(action = { transports: [] }) {
        try {
            const requestTime = Date.now();
            const response = await this.axiosInstance.post(CONFIG.GAME_ENDPOINT, action);
            const responseTime = Date.now();

            const gameState = response.data;
            if (gameState.error) {
              console.error('Game state error:', gameState.error);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return;
            }

            // Вычисление следующего хода
            const correctedState = this.correctState(gameState);
            const solution = await this.calculateMove(correctedState);

            const calculation = Date.now() - responseTime;
            const latency = responseTime - requestTime;
            const elapsedTime = calculation + latency;

            console.log(`Time: ${elapsedTime}ms. Latency: ${latency}ms, calc: ${calculation}ms`);

            // В прошлых играх был rate limit
            const remainingTime = Math.max(1, 350 - elapsedTime);
            await new Promise(resolve => setTimeout(resolve, remainingTime));

            return solution;
        } catch (error) {
            console.error('Request failed:', error.message);
            if (!error.message.includes(CONFIG.GO_AWAY_ERROR)) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async getStatus() {
        try {
            const response = await this.axiosInstance.get(CONFIG.STATUS_ENDPOINT);
            return response.data;
        } catch (error) {
            console.error('Не получилось получить статус:', error.message);
        }
    }

    correctState(gameState) {
        // Нужно реализовать
        return gameState;
    }

    async calculateMove(gameState) {
        const transportActions = await Promise.all(
            gameState.transports.map(transport => this.calculateAction(gameState, transport))
        );

        return {
            transports: transportActions
        };
    }

    calculateAction(gameState, transport) {
        // Нужно реализовать
        return {
            id: transport.id,
            acceleration: { x: 0, y: 0 },
            activateShield: false,
            attack: null
        };
    }

    processLogs(response) {
        this.logs.push(response);
        if (this.logs.length >= CONFIG.LOGS_LIMIT) {
            this.flushLogs();
        }
    }

    flushLogs() {
        if (this.logs.length === 0) return;

        const logFile = `logs/log${Date.now()}.txt`;

        fs.writeFileSync(logFile, this.logs.join('\n'));
        this.logs = [];
    }
}
