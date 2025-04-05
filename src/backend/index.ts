import { CONFIG } from "./config";
import { GameClient } from "./gameClient";

async function main() {
  console.log("Starting Word Tower builder...");

  // Check if token is set
  if (!CONFIG.TOKEN) {
    console.error("Error: AUTH_TOKEN is not set in .env file");
    console.error("Please create a .env file with AUTH_TOKEN=your_token_here");
    process.exit(1);
  }

  const client = new GameClient();

  try {
    // Get available words
    const wordsResponse = await client.getWords();
    console.log(`Available words: ${wordsResponse.words?.length || 0}`);

    if (CONFIG.SEND_REQUESTS) {
      // Build a tower with maximum floors (or max-1 if needed)
      const success = await client.buildTower(CONFIG.MAX_TOWER_FLOORS);

      if (success) {
        console.log("Tower built successfully!");
      } else {
        console.error("Failed to build tower");
      }
    } else {
      console.log("SEND_REQUESTS is disabled. Set to true in config.ts to build towers.");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    client.flushLogs();
    console.log("Shutting down...");
    process.exit();
  });
}

main().catch(console.error);
