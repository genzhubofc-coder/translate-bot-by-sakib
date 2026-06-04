import { Telegraf, type Context } from "telegraf";
import { db, usersTable, translationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { detectLanguage, translate, isCommand } from "./translator";
import { getSettings } from "./settings";
import { logger } from "./logger";

let bot: Telegraf | null = null;
let startTime = Date.now();
let botUsername: string | null = null;

export function getBot(): Telegraf | null {
  return bot;
}

export function getBotStatus() {
  return {
    running: bot !== null,
    botUsername,
    uptime: Math.floor((Date.now() - startTime) / 1000),
  };
}

async function upsertUser(ctx: Context) {
  const from = ctx.from;
  if (!from) return null;

  const telegramId = String(from.id);
  const now = new Date();

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, telegramId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(usersTable)
      .set({
        username: from.username || null,
        firstName: from.first_name || null,
        lastName: from.last_name || null,
        lastActive: now,
        totalMessages: sql`${usersTable.totalMessages} + 1`,
      })
      .where(eq(usersTable.telegramId, telegramId));
    return existing[0];
  } else {
    const [user] = await db
      .insert(usersTable)
      .values({
        telegramId,
        username: from.username || null,
        firstName: from.first_name || null,
        lastName: from.last_name || null,
        lastActive: now,
      })
      .returning();
    return user;
  }
}

async function handleStart(ctx: Context) {
  await upsertUser(ctx);
  const firstName = ctx.from?.first_name || "there";
  await ctx.reply(
    `Hello ${firstName}! 🤖\n\nI'm a Bangla↔English translation bot.\n\nJust send me any text:\n• Bangla → I'll translate to English\n• English → I'll translate to Bangla\n\nUse /help for more info.`,
  );
}

async function handleHelp(ctx: Context) {
  await upsertUser(ctx);
  await ctx.reply(
    `*Translation Bot Help*\n\n` +
    `• Send Bangla text → get English translation\n` +
    `• Send English text → get Bangla translation\n\n` +
    `*Commands:*\n` +
    `/start - Start the bot\n` +
    `/help - Show this help\n` +
    `/language - Language detection info\n` +
    `/stats - Your usage statistics`,
    { parse_mode: "Markdown" },
  );
}

async function handleLanguage(ctx: Context) {
  await upsertUser(ctx);
  await ctx.reply(
    `*Language Detection*\n\n` +
    `I automatically detect whether your message is in Bangla or English and translate accordingly.\n\n` +
    `Bangla (বাংলা) → English\nEnglish → Bangla (বাংলা)`,
    { parse_mode: "Markdown" },
  );
}

async function handleStats(ctx: Context) {
  const user = await upsertUser(ctx);
  if (!user) {
    await ctx.reply("Could not retrieve your stats.");
    return;
  }

  const joinDate = new Date(user.createdAt).toDateString();
  const lastActive = user.lastActive
    ? new Date(user.lastActive).toDateString()
    : "Just now";

  await ctx.reply(
    `*Your Statistics*\n\n` +
    `Total translations: ${user.totalTranslations}\n` +
    `Total messages: ${user.totalMessages}\n` +
    `Account created: ${joinDate}\n` +
    `Last active: ${lastActive}`,
    { parse_mode: "Markdown" },
  );
}

async function handleMessage(ctx: Context) {
  const message = ctx.message;
  if (!message || !("text" in message) || !message.text) return;

  const text = message.text.trim();
  if (!text || isCommand(text)) return;

  const settings = await getSettings();
  if (!settings.translationEnabled) {
    await ctx.reply("Translation is currently disabled. Please try again later.");
    return;
  }

  if (settings.maintenanceMode) {
    await ctx.reply("Bot is under maintenance. Please try again later.");
    return;
  }

  const user = await upsertUser(ctx);

  const sourceLang = detectLanguage(text);
  const targetLang = sourceLang === "bn" ? "en" : "bn";
  const direction: "bn-en" | "en-bn" = sourceLang === "bn" ? "bn-en" : "en-bn";

  const { translated, success } = await translate(text, sourceLang, targetLang);

  if (settings.loggingEnabled) {
    try {
      await db.insert(translationsTable).values({
        userId: user?.id || null,
        telegramUserId: ctx.from ? String(ctx.from.id) : null,
        username: ctx.from?.username || null,
        originalText: text,
        translatedText: translated,
        direction,
        success,
        chatType: ctx.chat?.type || null,
      });
    } catch (err) {
      logger.warn({ err }, "Failed to log translation");
    }
  }

  if (user) {
    await db
      .update(usersTable)
      .set({
        totalTranslations: sql`${usersTable.totalTranslations} + 1`,
      })
      .where(eq(usersTable.id, user.id));
  }

  if (!success) {
    await ctx.reply("Sorry, translation failed. Please try again.");
    return;
  }

  await ctx.reply(translated);
}

export async function initBot(token: string): Promise<void> {
  if (bot) {
    try {
      await bot.stop();
    } catch {}
    bot = null;
  }

  if (!token || token === "YOUR_BOT_TOKEN") {
    logger.info("No valid bot token configured, bot will not start");
    return;
  }

  try {
    bot = new Telegraf(token);

    bot.command("start", handleStart);
    bot.command("help", handleHelp);
    bot.command("language", handleLanguage);
    bot.command("stats", handleStats);
    bot.on("message", handleMessage);

    bot.catch((err: any) => {
      logger.error({ err }, "Telegram bot error");
    });

    const botInfo = await bot.telegram.getMe();
    botUsername = botInfo.username;
    startTime = Date.now();

    await bot.launch();
    logger.info({ botUsername }, "Telegram bot started");
  } catch (err) {
    logger.error({ err }, "Failed to start Telegram bot");
    bot = null;
  }
}

export async function stopBot(): Promise<void> {
  if (bot) {
    bot.stop("SIGTERM");
    bot = null;
  }
}

export async function handleWebhookUpdate(update: unknown): Promise<void> {
  if (bot) {
    await bot.handleUpdate(update as any);
  }
}
