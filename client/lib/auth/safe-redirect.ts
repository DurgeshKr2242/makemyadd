/**
 * Open-redirect guard for `?next=…`. Returns the input only if it is a same-
 * origin path; otherwise returns the fallback. Never let user input drive a
 * redirect to an absolute URL or a protocol-relative `//host` URL — that is
 * how phishing sites borrow authority from your domain.
 */
export function safeRedirect(
  next: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  if (next.startsWith("//")) return fallback;
  return next;
}
