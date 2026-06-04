import { pgTable, serial, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botStatisticsTable = pgTable("bot_statistics", {
  id: serial("id").primaryKey(),
  date: date("date", { mode: "string" }).notNull().unique(),
  totalMessages: integer("total_messages").notNull().default(0),
  totalTranslations: integer("total_translations").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  successfulTranslations: integer("successful_translations").notNull().default(0),
});

export const insertBotStatSchema = createInsertSchema(botStatisticsTable).omit({ id: true });
export type InsertBotStat = z.infer<typeof insertBotStatSchema>;
export type BotStat = typeof botStatisticsTable.$inferSelect;
