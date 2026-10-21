# Recipitation: brief

A private family recipe site, the smaller sibling of Inventoir. You browse, search and cook from it on your phone. New recipes come in as JSON from a Claude Desktop project, read from a photo, typed text or a link.

**Done when:** I sign in on my phone, find a recipe by searching, and follow it while cooking. I can also add a new recipe from a photo of a handwritten card.

## Stack and cost (€0/month)
- Next.js 16 App Router on Vercel Hobby, Supabase free (Postgres only in v1, no storage bucket), plain CSS adapted from Inventoir's `globals.css`.
- Dependencies: `next`, `react`, `react-dom`, `@supabase/ssr`, `@supabase/supabase-js`. This is Inventoir's list minus `@anthropic-ai/sdk`. Nothing new.
- Reused from Inventoir (read-only reference, never modified): email login with a link or code plus `ALLOWED_EMAILS`, the `src/proxy.ts` guard, the server and service Supabase clients, the paste-and-clean JSON pattern from `lib/receipt.ts`, the daily keep-alive cron, `robots: noindex`, and the CSS tokens with dark mode.
- Sign-in uses Supabase's own login, with your email as the only user. Public sign-ups are off.

## Decisions
| # | Decision |
|---|---|
| 1 | Editing: only my login can change anything. No public write access. |
| 2 | Visibility: v1 needs my login for everything. Family sharing (noindex open site, then per-recipe links) is in the backlog. |
| 3 | v1 scope: add recipes by pasting JSON, then browse, search, read and cook. Everything else is in the backlog. |
| 4 | Intake: JSON paste only, from the Claude project (`claude-project-instructions.md`). It accepts photos, typed text and links. Links fill `source_url` and, where the page has one, `image_url`. |
| 5 | Paste matching: **by `id`**. A paste without an id creates a new recipe. A paste with an id that exists replaces that recipe after a confirmation ("Αυτό θα αντικαταστήσει: Μπριάμ"). A paste with an unknown id is created with that id, so restoring an export works. |
| 6 | Ingredients: **fixed unit codes plus the original line**. Each item has `quantity` (number/null), `unit` (fixed code/null), `name`, `note` and `text`, inside optional groups. The page shows `text`. A future shopping list adds up matching `name` + `unit`. |
| 7 | Categories: **one fixed category plus 0 to 5 free tags.** |
| 8 | Interface language: **Greek.** |
| 9 | Unclear handwriting: Claude adds a **`warnings` list**. After a paste, the site shows a preview with the warnings above it, then you save. Warnings aren't stored. |
| 10 | Cooking mode: a **"Μαγείρεμα" button keeps the screen on** (browser screen wake lock, no dependency) and makes the text larger. |
| 11 | Greek search: the app fills a `search_text` column on save, normalised to lowercase, accents stripped and ς→σ. The query is normalised the same way. No Postgres extension. |
| 12 | Backups: a "Λήψη αντιγράφου (JSON)" button behind the login downloads every recipe in the paste schema. The paste box accepts that file's contents to restore. |
| 13 | Pictures are optional. `image_url` is shown from its remote address with a plain `<img>`, `referrerpolicy="no-referrer"`. If the image fails, the page drops back to the no-picture layout. No uploads in v1. |

## JSON schema (what you paste, and what the export contains)
One recipe, as returned by the Claude project (full rules in `claude-project-instructions.md`):

```json
{
  "id": null,
  "title": "Μπριάμ",
  "category": "Λαδερά",
  "tags": ["νηστίσιμο"],
  "from_person": "Γιαγιά Ελένη",
  "servings": 4,
  "yield": null,
  "prep_minutes": 20,
  "cook_minutes": 60,
  "ingredients": [{ "group": null, "items": [
    { "quantity": 1, "unit": "kg", "name": "πατάτες", "note": "σε ροδέλες", "text": "1 κιλό πατάτες σε ροδέλες" }
  ]}],
  "steps": [{ "group": null, "items": ["Προθερμαίνουμε τον φούρνο στους 180°C."] }],
  "notes": null,
  "source_url": null,
  "image_url": null,
  "warnings": []
}
```

- Unit codes: `g kg ml l tbsp tsp cup glass pc clove bunch pinch can pack slice`. The site shows them in Greek (γρ., κιλό, κ.σ., κ.γ., φλιτζ., νεροπότηρο …).
- Categories: Ορεκτικά, Σαλάτες, Σούπες, Λαδερά, Όσπρια, Ζυμαρικά & Ρύζι, Κρέας, Κοτόπουλο, Ψάρι & Θαλασσινά, Πίτες & Αρτοσκευάσματα, Γλυκά, Σάλτσες & Βάσεις, Ποτά, Άλλο.
- Export file: `{ "format": "recipitation", "version": 1, "exported_at": "…", "recipes": [ …recipes with their id… ] }`.
- The paste box accepts a single recipe, a list of recipes, or the export file. It tolerates code fences and text around the JSON, as Inventoir does. For several recipes, the preview shows "N νέες, M αντικαταστάσεις".
- Every field is cleaned on the server: unknown category becomes "Άλλο", unknown unit becomes null, non-http links become null, lengths are capped. As in Inventoir, nothing from the browser is trusted.

## Data model (`supabase/schema.sql`)
One table, `public.recipes`: `id uuid pk`, `title text not null`, `category text not null`, `tags text[]`, `from_person`, `servings int`, `yield`, `prep_minutes int`, `cook_minutes int`, `ingredients jsonb`, `steps jsonb`, `notes`, `source_url`, `image_url`, `search_text text not null`, `created_at`, `updated_at` (with a trigger that updates it on every change).
- RLS on. `anon` gets nothing (revoke). `authenticated` and `service_role` get explicit grants, because new tables aren't exposed automatically.
- Search covers the title, person, category, tags, ingredient names and notes.
- Future-proofing without changes now: a shopping list reads `ingredients` jsonb as stored. Family view later is one read-only rule for visitors plus a site setting. Per-recipe links add a nullable `share_token` column. No storage bucket until photo uploads arrive.

## Pages (Greek interface)
- `/login`: Inventoir's sign-in with an email link or 6-digit code.
- `/`: search box, category filter chips, recipe list (title, person, category, total time, small photo only if there is one).
- `/recipes/[id]`: photo (if any), quick facts, ingredients by group, numbered steps, notes, source link, a "Μαγείρεμα" button, "Αντιγραφή JSON" (to correct via Claude) and "Διαγραφή" with a confirmation.
- `/recipes/new`: paste, then preview with warnings and a replace/new count, then save. It also has a collapsible "Ρύθμιση Claude" section with the instructions and a copy button, as in Inventoir.
- `/api/export` (signed in only) and `/api/cron` (daily, `CRON_SECRET`, reads the table to keep Supabase awake).
- Phone first: large text, 44px tap targets, and good layouts without photos.

**Flag:** "Διαγραφή" (delete) isn't in the original v1 list. I've added it because without it, a duplicate paste can't be undone. It asks for confirmation and is behind your login. Drop it if you'd rather keep v1 minimal.

## BACKLOG.md (to be created at scaffold, in this order)
1. Family access without login: an open site with noindex, then per-recipe share links.
2. Shopping list: pick recipes, get a merged ingredient list you can tick off, ticks saved in the browser, no new table.
3. Monthly export reminder (press "Λήψη αντιγράφου" on the 1st). Later: automatic scheduled export.
4. Hand-typed add/edit form.
5. Uploading my own photos (handwritten cards) to Supabase storage.
6. Ticking off steps in cooking mode.
7. Installable phone app (PWA).

## Already known
- Supabase free plan: 2 active projects per account. Inventoir uses one, Recipitation takes the second.
- Some cooking sites block other sites from showing their images, or change image addresses. That's handled by the fallback in decision 13.
- `NEXT_PUBLIC_` values are fixed at build time, so redeploy after changing them. After every push, check that the commit SHA appears on Vercel's Deployments page.

## Phases
Scaffold → Supabase setup → local test → Vercel deploy → production smoke test on my phone. Each phase ends with a 3–5 line summary, then a commit and push to `github.com/geocorfu/Recipitation`. I'll ask before every deploy.
