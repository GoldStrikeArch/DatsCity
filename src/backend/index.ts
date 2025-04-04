import { CONFIG } from "./config";
import { GameClient } from "./gameClient";

async function main() {
    console.log('Старт...')
    const client = new GameClient();

    if (CONFIG.SEND_REQUESTS) {
        while (true) {
            await client.sendMove();
        }
    }

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        client.flushLogs();
        console.log('Завершение...')
        process.exit();
    });
}

main().catch(console.error);
