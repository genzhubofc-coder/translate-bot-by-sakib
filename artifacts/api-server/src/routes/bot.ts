import { Router, type IRouter } from "express";
import { handleWebhookUpdate, getBotStatus } from "../lib/bot";

const router: IRouter = Router();

router.post("/bot/webhook", async (req, res): Promise<void> => {
  await handleWebhookUpdate(req.body);
  res.json({ message: "OK" });
});

router.get("/bot/status", (_req, res): void => {
  res.json(getBotStatus());
});

export default router;
