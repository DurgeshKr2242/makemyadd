/**
 * Template configs — single source of truth.
 *
 * Two engineered templates × three formats = six configs. Each template
 * shares a design DNA across formats; the engine handles palette swap,
 * text auto-fit, and CTA hide-when-empty so a single config adapts to
 * brand colour, copy length, and language script.
 */
import { editorial1x1, editorial4x5, editorial9x16 } from "./editorial";
import { spotlight1x1, spotlight4x5, spotlight9x16 } from "./spotlight";

export const ALL_TEMPLATES = [
  spotlight1x1,
  spotlight9x16,
  spotlight4x5,
  editorial1x1,
  editorial9x16,
  editorial4x5,
] as const;

/**
 * Template families — used by the dashboard's grouped picker so the
 * UI shows "Spotlight" once with the user's current format selected,
 * rather than three separate cards.
 */
export const TEMPLATE_FAMILIES = [
  {
    id: "spotlight",
    name: "Spotlight",
    description:
      "Full-bleed product photo, bottom scrim, large editorial headline. The product is the hero.",
    members: {
      "1x1": spotlight1x1,
      "9x16": spotlight9x16,
      "4x5": spotlight4x5,
    },
  },
  {
    id: "editorial",
    name: "Editorial",
    description:
      "Magazine split — rounded product crop with a hairline-ruled paper column for headline, eyebrow, and CTA.",
    members: {
      "1x1": editorial1x1,
      "9x16": editorial9x16,
      "4x5": editorial4x5,
    },
  },
] as const;

export type TemplateFamilyId = (typeof TEMPLATE_FAMILIES)[number]["id"];
