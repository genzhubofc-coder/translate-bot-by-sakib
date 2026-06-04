import bcrypt from "bcrypt";
import { db, adminsTable, usersTable, translationsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { logger } from "./logger";

export async function seedDatabase() {
  try {
    // Seed default admin account
    const [adminCount] = await db.select({ c: count() }).from(adminsTable);
    if (Number(adminCount?.c ?? 0) === 0) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await db.insert(adminsTable).values({
        username: "admin",
        passwordHash,
      });
      logger.info("Created default admin account: admin / admin123");
    }

    // Seed sample users for demo
    const [userCount] = await db.select({ c: count() }).from(usersTable);
    if (Number(userCount?.c ?? 0) === 0) {
      const sampleUsers = [
        { telegramId: "100001", username: "rahim_dhaka", firstName: "Rahim", lastName: "Khan", totalMessages: 45, totalTranslations: 42 },
        { telegramId: "100002", username: "karim_bd", firstName: "Karim", lastName: "Ahmed", totalMessages: 23, totalTranslations: 21 },
        { telegramId: "100003", username: "john_doe", firstName: "John", lastName: "Doe", totalMessages: 18, totalTranslations: 15 },
        { telegramId: "100004", username: "fatema_begum", firstName: "Fatema", lastName: "Begum", totalMessages: 67, totalTranslations: 64, isBanned: false },
        { telegramId: "100005", username: "alex_smith", firstName: "Alex", lastName: "Smith", totalMessages: 12, totalTranslations: 10 },
        { telegramId: "100006", username: "nabila_hossain", firstName: "Nabila", lastName: "Hossain", totalMessages: 31, totalTranslations: 29 },
        { telegramId: "100007", username: "spammer123", firstName: "Spam", lastName: "Bot", totalMessages: 200, totalTranslations: 0, isBanned: true },
      ];

      const now = new Date();
      for (const u of sampleUsers) {
        const d = new Date(now);
        d.setDate(d.getDate() - Math.floor(Math.random() * 30));
        await db.insert(usersTable).values({
          ...u,
          lastActive: d,
          createdAt: new Date(d.getTime() - 86400000 * Math.floor(Math.random() * 60)),
        });
      }

      // Seed sample translations
      const users = await db.select().from(usersTable).limit(6);
      const sampleTranslations = [
        { orig: "আমি বাংলাদেশ থেকে এসেছি।", trans: "I am from Bangladesh.", dir: "bn-en" as const },
        { orig: "How are you today?", trans: "আজ আপনি কেমন আছেন?", dir: "en-bn" as const },
        { orig: "আপনার নাম কি?", trans: "What is your name?", dir: "bn-en" as const },
        { orig: "Good morning, how is the weather?", trans: "শুভ সকাল, আবহাওয়া কেমন?", dir: "en-bn" as const },
        { orig: "আমি তোমাকে ভালোবাসি।", trans: "I love you.", dir: "bn-en" as const },
        { orig: "Please help me find the station.", trans: "অনুগ্রহ করে আমাকে স্টেশন খুঁজে পেতে সাহায্য করুন।", dir: "en-bn" as const },
        { orig: "ধন্যবাদ আপনার সাহায্যের জন্য।", trans: "Thank you for your help.", dir: "bn-en" as const },
        { orig: "I want to learn Bangla.", trans: "আমি বাংলা শিখতে চাই।", dir: "en-bn" as const },
        { orig: "আমার বাড়ি ঢাকায়।", trans: "My home is in Dhaka.", dir: "bn-en" as const },
        { orig: "The food is very delicious.", trans: "খাবার অনেক সুস্বাদু।", dir: "en-bn" as const },
        { orig: "কত দিন হয় তুমি এখানে আছ?", trans: "How many days have you been here?", dir: "bn-en" as const },
        { orig: "See you tomorrow at the office.", trans: "আগামীকাল অফিসে দেখা হবে।", dir: "en-bn" as const },
      ];

      for (let i = 0; i < sampleTranslations.length; i++) {
        const t = sampleTranslations[i]!;
        const user = users[i % users.length];
        const d = new Date(now);
        d.setDate(d.getDate() - Math.floor(Math.random() * 14));
        d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        await db.insert(translationsTable).values({
          userId: user?.id ?? null,
          telegramUserId: user?.telegramId ?? null,
          username: user?.username ?? null,
          originalText: t.orig,
          translatedText: t.trans,
          direction: t.dir,
          success: true,
          chatType: Math.random() > 0.3 ? "private" : "group",
          createdAt: d,
        });
      }

      logger.info("Seeded sample users and translations");
    }
  } catch (err) {
    logger.warn({ err }, "Seed failed (non-fatal)");
  }
}
