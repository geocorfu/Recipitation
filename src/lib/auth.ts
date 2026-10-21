/** Extra guard on top of Supabase: only these emails may use the app. */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  // If the list is empty, fall back to Supabase's own user list.
  if (allowed.length === 0) return true;
  return allowed.includes(email.toLowerCase());
}
