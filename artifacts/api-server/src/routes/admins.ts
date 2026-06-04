import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db, adminsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { CreateAdminBody, DeleteAdminParams, UpdateAdminPasswordParams, UpdateAdminPasswordBody } from "@workspace/api-zod";
import { requireAuth } from "./auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/admins", async (_req, res): Promise<void> => {
  const admins = await db.select().from(adminsTable).orderBy(adminsTable.createdAt);
  res.json(
    admins.map((a) => ({
      id: a.id,
      username: a.username,
      createdAt: a.createdAt.toISOString(),
    })),
  );
});

router.post("/admins", async (req, res): Promise<void> => {
  const parsed = CreateAdminBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const [admin] = await db
    .insert(adminsTable)
    .values({ username: parsed.data.username, passwordHash })
    .returning();

  res.status(201).json({
    id: admin!.id,
    username: admin!.username,
    createdAt: admin!.createdAt.toISOString(),
  });
});

router.delete("/admins/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAdminParams.safeParse({ id: parseInt(raw!, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [countRow] = await db.select({ c: count() }).from(adminsTable);
  if (Number(countRow?.c ?? 0) <= 1) {
    res.status(400).json({ error: "Cannot delete the last admin account" });
    return;
  }

  const [deleted] = await db
    .delete(adminsTable)
    .where(eq(adminsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }

  res.sendStatus(204);
});

router.patch("/admins/:id/password", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAdminPasswordParams.safeParse({ id: parseInt(raw!, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAdminPasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [updated] = await db
    .update(adminsTable)
    .set({ passwordHash })
    .where(eq(adminsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Admin not found" });
    return;
  }

  res.json({ message: "Password updated successfully" });
});

export default router;
