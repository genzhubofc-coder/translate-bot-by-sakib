import { logger } from "./logger";

const BANGLA_RANGE = /[\u0980-\u09FF]/;

export function detectLanguage(text: string): "bn" | "en" {
  const banglaChars = (text.match(/[\u0980-\u09FF]/g) || []).length;
  const totalChars = text.replace(/\s/g, "").length;
  if (totalChars === 0) return "en";
  return banglaChars / totalChars > 0.2 ? "bn" : "en";
}

export function isCommand(text: string): boolean {
  return text.startsWith("/");
}

async function translateWithGoogleTranslateApiX(
  text: string,
  from: string,
  to: string,
): Promise<string | null> {
  try {
    const { translate } = await import("google-translate-api-x");
    const result = await (translate as any)(text, { from, to });
    return result.text as string;
  } catch (err) {
    logger.warn({ err }, "google-translate-api-x failed");
    return null;
  }
}

async function translateFallback(
  text: string,
  from: string,
  to: string,
): Promise<string | null> {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as any[][];
    if (!Array.isArray(data) || !data[0]) return null;
    return data[0]
      .map((item: any[]) => item[0])
      .filter(Boolean)
      .join("");
  } catch (err) {
    logger.warn({ err }, "Fallback translation failed");
    return null;
  }
}

export async function translate(
  text: string,
  from: "bn" | "en",
  to: "bn" | "en",
): Promise<{ translated: string; success: boolean }> {
  let translated = await translateWithGoogleTranslateApiX(text, from, to);

  if (!translated) {
    translated = await translateFallback(text, from, to);
  }

  if (!translated) {
    return { translated: text, success: false };
  }

  return { translated, success: true };
}
