import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db, adminsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody } from "@workspace/api-zod";

declare module "express-session" {
  interface SessionData {
    adminId?: number;
    adminUsername?: string;
  }
}

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [admin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.username, username))
    .limit(1);

  if (!admin) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  req.session.adminId = admin.id;
  req.session.adminUsername = admin.username;

  res.json({ id: admin.id, username: admin.username, createdAt: admin.createdAt.toISOString() });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.adminId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [admin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.id, req.session.adminId))
    .limit(1);

  if (!admin) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({ id: admin.id, username: admin.username, createdAt: admin.createdAt.toISOString() });
});

export function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.adminId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export default router;
