import "dotenv/config";

export const CONFIG = {
  SHOW_VISUALIZATION: true, // ?
  PLAY_SOUND: true,
  LOAD_FROM_FILE: true,
  SEND_REQUESTS: true, // переключить для отправки запросов
  DEBUG: false,
  LOGS_LIMIT: 100,
  TOKEN: process.env.AUTH_TOKEN,
  BASE_URL: "https://games-test.datsteam.dev",
  MAX_TOWER_FLOORS: 3, // Maximum number of floors to build
} as const;
