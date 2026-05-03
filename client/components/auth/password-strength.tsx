"use client";

import { cn } from "@/lib/utils";

export function scorePassword(p: string): 0 | 1 | 2 | 3 | 4 {
  if (!p) return 0;
  let score = 0;
  if (p.length >= 8) score += 1;
  if (/[0-9]/.test(p)) score += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(p)) score += 1;
  if (p.length >= 12 || (/[a-z]/.test(p) && /[A-Z]/.test(p))) score += 1;
  return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
}

/**
 * Four-segment password-strength meter. Saffron fills as score climbs from
 * 0 → 4. Renders nothing for an empty password (no premature shaming).
 * Accessible: announced as a progressbar with the score as `aria-valuenow`.
 */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = scorePassword(password);
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuenow={score}
      aria-label="Password strength"
      className="mt-2 grid grid-cols-4 gap-1.5"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "h-1 rounded-full transition-colors duration-fast",
            i < score ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}
