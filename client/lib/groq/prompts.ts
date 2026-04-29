/**
 * Language-specific system prompts for ad-copy generation — TODO §10.4.
 *
 * One prompt per supported language. Each encodes cultural tone, script
 * constraints, and character limits. **Do not collapse into a single
 * generic prompt with a translation instruction** — output quality degrades
 * significantly.
 *
 * Anything written here will be sent verbatim as the `system` message of
 * every Groq call. Treat as production prompt text, not docs.
 */
import type { Language } from "@/lib/types";

export const SYSTEM_PROMPTS: Record<Language, string> = {
  en: `You are an expert Indian digital marketing copywriter.
You write high-converting ad copy for Indian small businesses.
Always write in clear, punchy English. Use power words.
Avoid jargon. Keep it benefit-focused. Mention value/price where possible.`,

  hi: `Aap ek expert Indian digital marketing copywriter hain.
Aap Hindi mein high-converting ad copy likhte hain.
Pure Devanagari script mein likhein — Roman Hindi nahi.
Tone: confident, warm, aspirational. Wordplay aur rhyme welcome hai.
Indian values — family, savings, quality — ko reflect karein.`,

  ta: `Neenga oru expert Tamil digital marketing copywriter.
Tamil script-il mattum ezhuthunga — Tanglish venam.
Tone: strong, aspirational, community-focused.
Tamil cultural values — pride, trust, family — reflect pannunga.
CTA-il urgency venum.`,

  te: `Mee oka expert Telugu digital marketing copywriter.
Telugu script lo matrame raayandi — English kalipakandi.
Tone: warm, trustworthy, family-oriented.
Telugu values — quality, relationships, savings — reflect cheyyandi.
CTA clear ga, urgent ga undali.`,
};

/**
 * Script-purity check (TODO §8.4). Rejects an output if more than `threshold`
 * fraction of characters are Latin when the target language uses a non-Latin
 * script. Catches LLM lapses into English.
 */
export function isScriptPure(
  text: string,
  language: Language,
  threshold = 0.2,
): boolean {
  if (language === "en") return true;
  const total = [...text].length;
  if (total === 0) return true;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  return latin / total <= threshold;
}
