I want to build a family recipes website called Recipitation. Before writing any code, help me finish pinning down the scope. Ask me one question at a time, and give at most 2 options per question with a recommendation. When the open questions are settled, write a short BRIEF.md and wait for my go-ahead before building.

## Project location
- Local folder: C:\Users\George\Claude\Projects\Recipitation. Create and work only in that folder.
- GitHub repo (already created): https://github.com/geocorfu/Recipitation. Use it as the remote; do not create another repo.

## Starting point
I already built a similar app: C:\Users\George\Claude\Projects\Inventoir (household inventory, live on Vercel). Use it as a read-only reference: never modify it. Read its README, BACKLOG.md and src/ first, and reuse its stack, structure, styling, login and patterns wherever they fit. This new site should feel like its sibling, with fewer features.

- Stack: Next.js 16 App Router on Vercel (Hobby), Supabase (Postgres + storage), plain CSS like Inventoir. No new dependencies without asking me.
- Next.js 16 notes: the middleware file is now `src/proxy.ts`, and `params`/`searchParams`/`cookies()` are async. Check node_modules/next/dist/docs before using any Next API you're unsure about.
- Cost: must stay €0/month. No paid APIs. Photos of recipes are read the Inventoir way: a Claude Desktop project with specific instructions returns JSON that I paste into the site.

## What I have in mind (challenge it)
- Family recipes: title, photo, ingredients, steps, servings, time, tags/category, who it's from (e.g. "Grandma's"), notes. Most recipes are in Greek, some handwritten.
- Browse and search on the phone while cooking. It must be readable on a small screen with messy hands.
- v1 is private: viewing also needs my login. Letting family view without a login comes later (see decision 2).

## Decisions already made (don't reopen, but flag problems)
1. Editing: a simple login for me only, the same mechanism as Inventoir. Public write access is not acceptable.
2. Visibility: v1 is private access only (everything behind my login). Later, add family sharing by link, in two steps: an open site hidden from search engines (noindex), and per-recipe share links. Both go in BACKLOG.md, and the v1 design must not make them hard to add.
3. v1 scope: add a recipe from JSON produced by a Claude Desktop project with specific instructions. Everything else goes in BACKLOG.md.
4. Recipe intake: v1 is JSON paste only (typed recipes also go through the Claude Desktop project, which returns the same JSON). The Claude Desktop project must also accept a link to a recipe on a cooking site, read the page, and return the same JSON plus the original link as `source_url`, shown on the recipe page. Ingredients in the JSON must be structured (quantity, unit, name) so a shopping list can be built from them later, and a source link and structured ingredients must not need a schema change when the shopping list arrives. A hand-typed add/edit form goes in BACKLOG.md. Fixing a recipe in v1 means pasting corrected JSON over the old one, so propose how a paste is matched to an existing recipe (replace vs. create new).
5. Backups: an export must exist from day one (a free Supabase project has no self-service restore).
6. Greek search: a normalized `search_text` column filled in by the app on save (lowercase, accents stripped, final sigma ς mapped to σ), with the search box applying the same normalization to the query, so "μπριαμ" finds "Μπριάμ". No Postgres extension, no new dependency.
7. Shopping list: not in v1, first item in BACKLOG.md. Idea for later: pick one or more recipes, get a merged tickable ingredient list, ticks saved in the browser with no new table. v1 only has to keep ingredients structured so this is easy to add.
8. Export: a button behind my login that downloads one JSON file with all recipes, in the same schema I paste in (photo links included), so it can be re-imported through the paste flow. I press it manually; add a monthly reminder to BACKLOG.md. An automatic scheduled export is a later option.
9. Pictures are optional and secondary: a recipe is valid without one. If the JSON has an `image_url` (the Claude Desktop project fills it when the recipe comes from a link), the site just displays it from the remote address. No file picker, no download or upload to storage in v1. Uploading my own photos (e.g. handwritten cards) goes in BACKLOG.md. The recipe list and pages must look good without pictures.

## Still to settle with me (one question at a time)
- The JSON schema and the instructions for the Claude Desktop project (I will paste those instructions into a Claude Desktop project, so draft them as part of the brief, and also save them as a separate file, claude-project-instructions.md, in the project folder so I can paste it directly).

## Lessons from Inventoir (apply all of them)
- Supabase: with auto-expose of new tables off, write explicit grants in schema.sql, including for service_role if a cron uses it. Enable RLS on every table.
- A free Supabase project pauses after inactivity. Use a daily Vercel cron that queries the database to keep it awake.
- After every push, confirm the commit SHA actually appears on the Vercel Deployments page. Auto-deploy has silently skipped a push before.
- NEXT_PUBLIC_ variables are inlined at build time, so redeploy after changing them.

## Ground rules
- Never print, log or commit secrets. Keep .env.local out of git. I paste keys into .env.local and Vercel myself. Never ask me to paste secrets into chat.
- Stop and tell me whenever a step needs something only I can do (creating accounts, pasting keys, clicking in dashboards). Give me numbered steps in one block so I don't have to scroll.
- Small, reviewable changes. Conventional commits. Commit and push to GitHub at the end of every run, and tell me before any deploy.
- Never delete anything outright. Tell me what and why first.
- After each phase: 3 to 5 lines covering what you did, what you verified, and what's next.

Phases after the brief: scaffold → Supabase setup → local test → Vercel deploy → production smoke test on my phone.
"Done when": I log in on my phone, find a recipe by searching, and follow it while cooking; and I can add a new recipe from a photo of a handwritten card. (Family access without a login is the first backlog item.)
