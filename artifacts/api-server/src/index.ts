import app from "./app";
import { logger } from "./lib/logger";
import { getSettings } from "./lib/settings";
import { initBot } from "./lib/bot";
import { seedDatabase } from "./lib/seed";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Seed database with initial data
  await seedDatabase();

  // Start Telegram bot if token is configured
  try {
    const settings = await getSettings();
    if (settings.botToken) {
      await initBot(settings.botToken);
    } else {
      logger.info("No bot token configured, skipping bot startup");
    }
  } catch (err) {
    logger.warn({ err }, "Failed to initialize bot on startup");
  }
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down");
  process.exit(0);
});
