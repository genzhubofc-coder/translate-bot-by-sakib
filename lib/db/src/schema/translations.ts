import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const translationsTable = pgTable("translations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => usersTable.id),
  telegramUserId: text("telegram_user_id"),
  username: text("username"),
  originalText: text("original_text").notNull(),
  translatedText: text("translated_text").notNull(),
  direction: text("direction").notNull().$type<"bn-en" | "en-bn">(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  success: boolean("success").notNull().default(true),
  chatType: text("chat_type"),
});

export const insertTranslationSchema = createInsertSchema(translationsTable).omit({ id: true, createdAt: true });
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type Translation = typeof translationsTable.$inferSelect;
