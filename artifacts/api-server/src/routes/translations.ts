import { Router, type IRouter } from "express";
import { db, translationsTable } from "@workspace/db";
import { eq, ilike, and, gte, lte, count, sql } from "drizzle-orm";
import { ListTranslationsQueryParams, ExportTranslationsQueryParams } from "@workspace/api-zod";
import { requireAuth } from "./auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/translations", async (req, res): Promise<void> => {
  const parsed = ListTranslationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page = 1, limit = 20, search, direction, userId, dateFrom, dateTo } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (search) conditions.push(ilike(translationsTable.originalText, `%${search}%`));
  if (direction) conditions.push(eq(translationsTable.direction, direction as "bn-en" | "en-bn"));
  if (userId) conditions.push(eq(translationsTable.userId, userId));
  if (dateFrom) conditions.push(gte(translationsTable.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(translationsTable.createdAt, new Date(dateTo)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [translations, [totalRow]] = await Promise.all([
    db
      .select()
      .from(translationsTable)
      .where(whereClause)
      .orderBy(sql`${translationsTable.createdAt} DESC`)
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(translationsTable).where(whereClause),
  ]);

  res.json({
    translations: translations.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    total: Number(totalRow?.count ?? 0),
    page,
    limit,
  });
});

router.get("/translations/export", async (req, res): Promise<void> => {
  const parsed = ExportTranslationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { direction, dateFrom, dateTo } = parsed.data;

  const conditions: any[] = [];
  if (direction) conditions.push(eq(translationsTable.direction, direction as "bn-en" | "en-bn"));
  if (dateFrom) conditions.push(gte(translationsTable.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(translationsTable.createdAt, new Date(dateTo)));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(translationsTable)
    .where(whereClause)
    .orderBy(sql`${translationsTable.createdAt} DESC`)
    .limit(10000);

  const headers = "id,user_id,telegram_user_id,username,original_text,translated_text,direction,created_at,success,chat_type\n";
  const csvRows = rows
    .map((t) => {
      const escape = (v: string | null | undefined) =>
        v == null ? "" : `"${String(v).replace(/"/g, '""')}"`;
      return [
        t.id,
        t.userId ?? "",
        t.telegramUserId ?? "",
        escape(t.username),
        escape(t.originalText),
        escape(t.translatedText),
        t.direction,
        t.createdAt.toISOString(),
        t.success,
        t.chatType ?? "",
      ].join(",");
    })
    .join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=translations.csv");
  res.send(headers + csvRows);
});

export default router;
