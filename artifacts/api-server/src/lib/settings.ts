import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULTS = {
  botToken: "",
  translationEnabled: "true",
  loggingEnabled: "true",
  maintenanceMode: "false",
  rateLimitPerMinute: "30",
};

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db
    .select()
    .from(settingsTable)
    .where(eq(settingsTable.key, key))
    .limit(1);
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function getSettings() {
  const [token, translationEnabled, loggingEnabled, maintenanceMode, rateLimit] =
    await Promise.all([
      getSetting("botToken"),
      getSetting("translationEnabled"),
      getSetting("loggingEnabled"),
      getSetting("maintenanceMode"),
      getSetting("rateLimitPerMinute"),
    ]);

  return {
    botToken: token ?? DEFAULTS.botToken,
    translationEnabled: (translationEnabled ?? DEFAULTS.translationEnabled) === "true",
    loggingEnabled: (loggingEnabled ?? DEFAULTS.loggingEnabled) === "true",
    maintenanceMode: (maintenanceMode ?? DEFAULTS.maintenanceMode) === "true",
    rateLimitPerMinute: parseInt(rateLimit ?? DEFAULTS.rateLimitPerMinute, 10),
  };
}

export async function updateSettings(data: {
  botToken?: string;
  translationEnabled?: boolean;
  loggingEnabled?: boolean;
  maintenanceMode?: boolean;
  rateLimitPerMinute?: number;
}) {
  const updates: Array<Promise<void>> = [];

  if (data.botToken !== undefined)
    updates.push(setSetting("botToken", data.botToken));
  if (data.translationEnabled !== undefined)
    updates.push(setSetting("translationEnabled", String(data.translationEnabled)));
  if (data.loggingEnabled !== undefined)
    updates.push(setSetting("loggingEnabled", String(data.loggingEnabled)));
  if (data.maintenanceMode !== undefined)
    updates.push(setSetting("maintenanceMode", String(data.maintenanceMode)));
  if (data.rateLimitPerMinute !== undefined)
    updates.push(setSetting("rateLimitPerMinute", String(data.rateLimitPerMinute)));

  await Promise.all(updates);
  return getSettings();
}
