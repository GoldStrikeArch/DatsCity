export const CONFIG = {
  SHOW_VISUALIZATION: true, // ?
  PLAY_SOUND: true,
  LOAD_FROM_FILE: true,
  SEND_REQUESTS: false, // переключить для отправки запросов
  DEBUG: false,
  LOGS_LIMIT: 100,
  TOKEN: "НАШ ТОКЕН",
  BASE_URL: "https://games-test.datsteam.dev",
  GAME_ENDPOINT: "/play/magcarp/player/move", // поменять
  STATUS_ENDPOINT: "/rounds/magcarp", // поменять
  GO_AWAY_ERROR: "GOAWAY", // поменять
} as const;
