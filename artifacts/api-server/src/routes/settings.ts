import { Router, type IRouter } from "express";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { getSettings, updateSettings } from "../lib/settings";
import { initBot, stopBot } from "../lib/bot";
import { requireAuth } from "./auth";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getSettings();
  res.json(settings);
});

router.patch("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const prevSettings = await getSettings();
  const updated = await updateSettings(parsed.data);

  // Restart bot if token changed
  if (parsed.data.botToken !== undefined && parsed.data.botToken !== prevSettings.botToken) {
    if (parsed.data.botToken) {
      await initBot(parsed.data.botToken);
    } else {
      await stopBot();
    }
  }

  res.json(updated);
});

export default router;
