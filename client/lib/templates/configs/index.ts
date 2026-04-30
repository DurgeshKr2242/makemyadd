// client/lib/templates/configs/index.ts
import { cleanMinimal1x1 } from "./clean-minimal-1x1";
import { cleanMinimal4x5 } from "./clean-minimal-4x5";
import { cleanMinimal9x16 } from "./clean-minimal-9x16";
import { festivalBright1x1 } from "./festival-bright-1x1";
import { festivalBright4x5 } from "./festival-bright-4x5";
import { festivalBright9x16 } from "./festival-bright-9x16";
import { trustBadge1x1 } from "./trust-badge-1x1";
import { urgencyRed1x1 } from "./urgency-red-1x1";
import { urgencyRed4x5 } from "./urgency-red-4x5";
import { urgencyRed9x16 } from "./urgency-red-9x16";

export const ALL_TEMPLATES = [
  festivalBright1x1,
  festivalBright9x16,
  festivalBright4x5,
  cleanMinimal1x1,
  cleanMinimal9x16,
  cleanMinimal4x5,
  urgencyRed1x1,
  urgencyRed9x16,
  urgencyRed4x5,
  trustBadge1x1,
];
