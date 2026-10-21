# Recipitation

A private family recipe site. Browse, search and cook from it on your phone. Recipes come in as JSON from a Claude Desktop project that reads photos (including handwritten cards), typed text or links to cooking sites.

**Stack:** Next.js 16 (Vercel Hobby) · Supabase (database + login) · no paid APIs. Built as the sibling of Inventoir.

## Set it up (one time)

### 1. Supabase
1. Create a free project at supabase.com (the free plan allows 2 active projects).
2. **SQL Editor** → New query → paste all of `supabase/schema.sql` → Run.
3. **Authentication → Sign In / Providers**: turn **off** "Allow new users to sign up".
4. **Authentication → Users → Add user** → your email, any strong password (required by the form, never used: the site signs in by email only), tick "Auto confirm".
5. Sign-in is by the emailed link, opened in the same browser that asked for it. The typeable code needs `Or enter this code: {{ .Token }}` in the Magic link template, and Supabase only allows editing templates with a custom SMTP sender (see BACKLOG).
6. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key into `.env.local` (see `.env.example`). Never share or commit the service role key.

### 2. Claude Desktop project
In Claude Desktop or claude.ai, create a project called "Συνταγές" and paste `claude-project-instructions.md` into its instructions (the Add page also has a copy button). Send a photo, text or link in a chat there, copy the whole reply and paste it on **+ Νέα**.

### 3. Vercel
1. vercel.com → Add New → Project → import `geocorfu/Recipitation`.
2. Add the environment variables from `.env.example`.
3. Deploy. Then in Supabase → Authentication → URL Configuration, set **Site URL** to the Vercel address and add `https://YOUR-APP.vercel.app/auth/callback` to the redirect URLs.

## How it works
- **Add / fix:** paste Claude's reply, check the preview (and Claude's warnings), save. A paste whose `id` matches a saved recipe replaces it after a confirmation; no `id` creates a new one. To fix a recipe: **Αντιγραφή JSON** on its page → give it to Claude with the correction → paste the reply.
- **Search:** accent- and case-insensitive ("μπριαμ" finds "Μπριάμ"), across title, person, category, tags, ingredients and notes.
- **Cooking mode:** keeps the screen on and enlarges the text.
- **Metric amounts:** cups, glasses and spoons show grams/ml next to the original line, from argiro.gr's δοσομετρητής. "περίπου" marks Claude's estimates.
- **Backup:** **Λήψη αντιγράφου (JSON)** at the bottom of the home page downloads every recipe in the paste format. Pasting that file on **+ Νέα** restores it. Free Supabase has no self-service restore, so do this monthly.
- **Daily job** (`vercel.json`): reads the database every day so the free Supabase project doesn't pause.
- **Privacy:** every page needs a signed-in user on `ALLOWED_EMAILS`; the site is `noindex`.

## Run locally
```bash
cp .env.example .env.local   # fill it in
npm install
npm run dev
```
