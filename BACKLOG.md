# Backlog

Not in v1 scope. In order of priority.

## Next
1. **Family access without login**, in two steps:
   - Open site hidden from search engines: `robots: noindex` is already set. Add a read-only `select` grant and policy for `anon` on `recipes`, and let the proxy allow reading pages without a login. Editing, the Add page and export stay behind the login.
   - Per-recipe share links: add a nullable `share_token` column and a `/s/[token]` page that reads that one recipe.
2. **Shopping list**: pick one or more recipes and get one merged list to tick off, with ticks saved in the browser (no new table). Merge items by normalised `name` + `unit`, adding up `quantity` or `metric.amount`. Ingredients are already stored structured for this.
3. **Monthly backup reminder**: press "Λήψη αντιγράφου (JSON)" on the 1st of each month and keep the file somewhere safe. Later option: an automatic scheduled export, e.g. the daily cron emailing the file monthly.

## If the sign-in link is a nuisance on the phone
- Connect Resend (already used for Inventoir) as custom SMTP in Supabase → Authentication → Emails → SMTP Settings, then add `Or enter this code: {{ .Token }}` to the Magic link template. The login page already accepts the code. Skipped on 21/10/2026: Supabase locks templates without custom SMTP.

## Later
- Hand-typed add/edit form, so small fixes don't need the Claude project.
- Upload my own photos (e.g. handwritten cards) to a Supabase storage bucket.
- Tick off steps in cooking mode.
- Installable phone app (PWA: manifest + icons) so it opens like an app from the home screen.
- Error boundary page (`error.tsx`) with a friendly message.
