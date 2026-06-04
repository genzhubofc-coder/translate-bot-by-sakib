import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or, count, sql } from "drizzle-orm";
import { ListUsersQueryParams, GetUserParams, DeleteUserParams, BanUserParams, UnbanUserParams } from "@workspace/api-zod";
import { requireAuth } from "./auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/users", async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { page = 1, limit = 20, search, banned } = parsed.data;
  const offset = (page - 1) * limit;

  let query = db.select().from(usersTable);
  let countQuery = db.select({ count: count() }).from(usersTable);

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(usersTable.username, `%${search}%`),
        ilike(usersTable.firstName, `%${search}%`),
        ilike(usersTable.lastName, `%${search}%`),
        eq(usersTable.telegramId, search),
      ),
    );
  }
  if (banned !== undefined && banned !== null) {
    conditions.push(eq(usersTable.isBanned, banned));
  }

  if (conditions.length > 0) {
    const whereClause = conditions.length === 1 ? conditions[0]! : sql`${conditions[0]} AND ${conditions[1]}`;
    query = query.where(whereClause) as any;
    countQuery = countQuery.where(whereClause) as any;
  }

  const [users, [totalRow]] = await Promise.all([
    query.orderBy(usersTable.createdAt).limit(limit).offset(offset),
    countQuery,
  ]);

  res.json({
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      lastActive: u.lastActive?.toISOString() ?? null,
    })),
    total: Number(totalRow?.count ?? 0),
    page,
    limit,
  });
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetUserParams.safeParse({ id: parseInt(raw!, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.id))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastActive: user.lastActive?.toISOString() ?? null,
  });
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteUserParams.safeParse({ id: parseInt(raw!, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(usersTable)
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/users/:id/ban", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = BanUserParams.safeParse({ id: parseInt(raw!, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ isBanned: true })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastActive: user.lastActive?.toISOString() ?? null,
  });
});

router.patch("/users/:id/unban", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UnbanUserParams.safeParse({ id: parseInt(raw!, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set({ isBanned: false })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastActive: user.lastActive?.toISOString() ?? null,
  });
});

export default router;
