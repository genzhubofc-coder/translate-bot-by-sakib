import { Router, type IRouter } from "express";
import { db, usersTable, translationsTable } from "@workspace/db";
import { count, sql, eq, and, gte } from "drizzle-orm";
import { requireAuth } from "./auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/stats/overview", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsersRow,
    activeTodayRow,
    bannedRow,
    totalMessagesRow,
    totalTranslationsRow,
    successRow,
    bnToEnRow,
    enToBnRow,
  ] = await Promise.all([
    db.select({ count: count() }).from(usersTable),
    db.select({ count: count() }).from(usersTable).where(gte(usersTable.lastActive, today)),
    db.select({ count: count() }).from(usersTable).where(eq(usersTable.isBanned, true)),
    db.select({ total: sql<number>`sum(total_messages)` }).from(usersTable),
    db.select({ count: count() }).from(translationsTable),
    db.select({ count: count() }).from(translationsTable).where(eq(translationsTable.success, true)),
    db.select({ count: count() }).from(translationsTable).where(eq(translationsTable.direction, "bn-en")),
    db.select({ count: count() }).from(translationsTable).where(eq(translationsTable.direction, "en-bn")),
  ]);

  const totalTranslations = Number(totalTranslationsRow[0]?.count ?? 0);
  const successfulTranslations = Number(successRow[0]?.count ?? 0);
  const successRate = totalTranslations > 0
    ? Math.round((successfulTranslations / totalTranslations) * 100 * 10) / 10
    : 100;

  res.json({
    totalUsers: Number(totalUsersRow[0]?.count ?? 0),
    activeTodayUsers: Number(activeTodayRow[0]?.count ?? 0),
    totalMessages: Number(totalMessagesRow[0]?.total ?? 0),
    totalTranslations,
    successRate,
    bnToEnCount: Number(bnToEnRow[0]?.count ?? 0),
    enToBnCount: Number(enToBnRow[0]?.count ?? 0),
    bannedUsers: Number(bannedRow[0]?.count ?? 0),
  });
});

router.get("/stats/daily", async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      DATE(created_at AT TIME ZONE 'UTC') as date,
      COUNT(*) as translations,
      COUNT(DISTINCT telegram_user_id) as users,
      COUNT(*) as messages
    FROM translations
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at AT TIME ZONE 'UTC')
    ORDER BY date ASC
  `);

  const data = (rows.rows as any[]).map((r) => ({
    date: r.date,
    messages: Number(r.messages),
    translations: Number(r.translations),
    users: Number(r.users),
  }));

  res.json(data);
});

router.get("/stats/weekly", async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') as week,
      COUNT(*) as translations,
      COUNT(DISTINCT telegram_user_id) as users,
      COUNT(*) as messages
    FROM translations
    WHERE created_at >= NOW() - INTERVAL '12 weeks'
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY week ASC
  `);

  const data = (rows.rows as any[]).map((r) => ({
    week: r.week,
    messages: Number(r.messages),
    translations: Number(r.translations),
    users: Number(r.users),
  }));

  res.json(data);
});

router.get("/stats/monthly", async (_req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT
      TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
      COUNT(*) as translations,
      COUNT(DISTINCT telegram_user_id) as users,
      COUNT(*) as messages
    FROM translations
    WHERE created_at >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month ASC
  `);

  const data = (rows.rows as any[]).map((r) => ({
    month: r.month,
    messages: Number(r.messages),
    translations: Number(r.translations),
    users: Number(r.users),
  }));

  res.json(data);
});

router.get("/stats/activity", async (_req, res): Promise<void> => {
  const recent = await db
    .select()
    .from(translationsTable)
    .orderBy(sql`${translationsTable.createdAt} DESC`)
    .limit(20);

  const items = recent.map((t) => ({
    id: t.id,
    type: t.direction === "bn-en" ? "bn_to_en" : "en_to_bn",
    description: `${t.direction === "bn-en" ? "BN→EN" : "EN→BN"}: "${t.originalText.slice(0, 50)}${t.originalText.length > 50 ? "..." : ""}"`,
    username: t.username ?? null,
    createdAt: t.createdAt.toISOString(),
  }));

  res.json(items);
});

export default router;
