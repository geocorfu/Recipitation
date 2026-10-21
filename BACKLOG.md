# Backlog

Not in v1 scope. In order of priority.

## Next
1. Done 21/10/2026: **family access without login** (read-only open site, `noindex`). Per-recipe share links are no longer needed while the whole site is readable; revisit only if the site goes private again.
2. Done 21/10/2026: **shopping list** (`/list`). Follow-ups if wanted: scale a recipe by servings before adding; share one list between phones (needs a table).
3. **Monthly backup reminder**: press "Λήψη αντιγράφου (JSON)" on the 1st of each month and keep the file somewhere safe. Later option: an automatic scheduled export, e.g. the daily cron emailing the file monthly.

## If the sign-in link is a nuisance on the phone
- Connect Resend (already used for Inventoir) as custom SMTP in Supabase → Authentication → Emails → SMTP Settings, then add `Or enter this code: {{ .Token }}` to the Magic link template. The login page already accepts the code. Skipped on 21/10/2026: Supabase locks templates without custom SMTP.

## Later
- Hand-typed add/edit form, so small fixes don't need the Claude project.
- Upload my own photos (e.g. handwritten cards) to a Supabase storage bucket.
- Tick off steps in cooking mode.
- Installable phone app (PWA: manifest + icons) so it opens like an app from the home screen.
- Error boundary page (`error.tsx`) with a friendly message.
