/**
 * Discriminated result returned by every auth server action. The UI layer
 * narrows on `ok`: success → `data`; failure → toast `error`, optionally
 * mapping `field` to RHF `setError(field, ...)` for inline display.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

export const ok = <T>(data: T): ActionResult<T> => ({ ok: true, data });
export const err = (error: string, field?: string): ActionResult<never> =>
  field ? { ok: false, error, field } : { ok: false, error };
