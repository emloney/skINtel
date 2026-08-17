# Getting SkinTel running

Quick notes for running this locally. Should take ~5 min.

## 1. Clone and install

```bash
git clone https://github.com/emloney/skINtel.git
cd skINtel
npm install
```

## 2. Make a `.env` file

In the repo root (the folder with `package.json` in it), create a file called
`.env` with these two lines:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

**Ask me for the values** — they're not in the repo on purpose (keys shouldn't
be in git). There's a `.env.example` you can copy as a template.

Without this the app builds fine but shows a blank white page, with
"Missing Supabase environment variables" in the browser console. That just
means the `.env` is missing or misnamed.

## 3. Run it

```bash
npm run dev
```

Opens at http://localhost:5173

## That's it

You don't need to set up the database or deploy anything — we share one Supabase
project and it's all already done there (tables, security rules, and the two AI
functions).

Make your own account through the signup page; profiles and shelves are per-user
so we won't step on each other's data.

## What's in here

- `src/pages/` — the screens (Home, Onboarding, Products, Scan History, Auth)
- `src/components/` — the pieces (skin quiz, analysis panel, chatbot, profile menu…)
- `src/lib/` — the actual logic:
  - `analysis.ts` — ingredient safety scoring
  - `interactions.ts` — routine conflicts + teen-safe rules
- `supabase/` — SQL scripts + the Edge Functions (already deployed, just kept here
  for reference)

## Heads up

- The AI bits (product summary, chatbot) run through Supabase Edge Functions on
  Groq. If they don't respond, it's usually a rate limit — everything else still
  works fine without them.
- `src/components/ShelfConflictsPanel.tsx` and `src/lib/conflictDetection.ts`
  aren't used by anything — leftover duplicates. Ignore them (or we can delete).
