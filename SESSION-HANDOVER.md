# CONVERGENCE 2026 — Session Handover
_Saved: 23 August 2026 (night before fest)_

## What this project is

Fest website + admin system for **CONVERGENCE 2026**, the inter-collegiate mathematics
fest of CHRIST (Deemed to be University), Bengaluru — main day **August 24, 2026**.

Stack: **React 19 + Vite** (static site) · **Node admin server** (local) ·
**GitHub-sync** (cloud editing from Vercel) · deployed on **Vercel** (`convergence`).

---

## Commands cheat-sheet

| Command | What it does |
|---|---|
| `npm start` | Laptop server: site on :3001 + full admin API |
| `npm run dev` | Vite dev server (no API) |
| `npm run build` | Production build → `dist/` |
| `npm run build-data` | Regenerate site data from raw files |
| `npm run audit` | Integrity scan of XLSX + on-spot entries |
| `npm run verify-lists` | Cross-check coordinator event CSVs vs XLSX |
| `node scripts/test-event-matching.mjs` | Typo-matching test suite (16 cases) |

Admin panel: `http://localhost:3001/#/admin` — password `convergence26`
(override: `ADMIN_PASSWORD=... npm start`). On Vercel, login = GitHub fine-grained token.

---

## Architecture

```
files/                          RAW private data (GITIGNORED — never push)
├─ Convergence 2026 Registration Form (Responses).xlsx   ← master registrations
├─ Participants - Sheet1.csv                             ← master participant list (291)
├─ scores.csv                     results entered by core team (or via admin UI)
├─ <event folders>/               posters, reels, coordinator participant lists
└─ data-admin stores moved → data-admin/

data-admin/                     admin-editable stores
├─ scores.csv                    TRACKED (GitHub-sync target)
├─ events-overrides.json         TRACKED (event edits from #/admin)
├─ attendance.json               TRACKED (check-in marks, names only)
├─ onspot-public.json            TRACKED (remote quick-adds, no contacts)
├─ onspot-registrations.json     GITIGNORED (full on-spot w/ phones)
└─ verification.json             GITIGNORED (verified/paid flags)

scripts/
├─ build-data.mjs                parses raw files → src/data/generated/*.json
│                                 exports helpers used by admin-server
├─ admin-server.mjs              local Node server (site + auth + CRUD APIs)
├─ audit-data.mjs                integrity scanner
├─ verify-event-lists.mjs        per-event CSV vs XLSX cross-check
└─ test-event-matching.mjs       fuzzy event-name tests

src/data/generated/             COMMITTED site data (built by build-data)
├─ events.json                   EVENTS incl. admin overrides
├─ participants.json             colleges/participants/events aggregation
├─ checkin.json                  public-safe roster (name+college+events, NO phones)
└─ leaderboard.json              points standings (rank→points: 10/7/5/3/rest=1)

src/components/AdminPanels.jsx  CheckInLocal/CheckInRemote, EventTeams, ScoreEntry,
                                EventEditor, OnSpotEntry, ImportPanel, RegistrationsViewer, Dashboard
src/components/Admin.jsx        shell: login, mode detection (laptop/cloud), tabs, toasts
```

---

## Admin panel tabs

1. **Check-In** — search student (name/phone), Mark Present, quick-add missing people
   as on-spot. Local: full data + instant saves. Cloud (Vercel): bundled roster,
   batched "☁ Sync n to GitHub" commits.
2. **Event Teams** — per-event roster cards: LEAD badge (form filler) vs members,
   clickable phones, source badge.
3. **Dashboard** — 8 stat cards (clickable).
4. **Edit Events** — all event fields + rules; auto-rebuilds locally, GitHub-commit remotely.
5. **Enter Results** — rank rows per event, replace-on-save, points auto-calc, clear-all.
6. **On-Spot Reg.** — dynamic teammates (up to 6), paid toggle = auto-verify.
7. **Import CSV** — upload CSV → auto column mapping → preview → import as
   Scores / Registrations / Participants List (merge or replace). Event auto-detected
   from filename ("math heist finals.csv" → Math Heist). Duplicate-skipping built in.
8. **Registrations** — searchable table, Verify/Paid toggles, source filters, Export CSV.

Multiple core members can log in simultaneously (stateless tokens). On Vercel,
the password box doubles as a GitHub token gate.

---

## Verified data snapshot (23 Aug night)

- **291** participants in master CSV (+ your evening additions)
- **220** team-event registrations parsed from XLSX (3 slot columns!)
- **173** unique submitters (5 duplicate submissions deduped, 2 junk rows dropped)
- **317** unique people for check-in roster
- **9** normalized colleges — BYC ≠ Yeshwanthpur kept separate
- Event fuzzy matching: 16/16 tests pass ("Vortext"/"Votex" → Vertex, etc.)

---

## Known issues / pending (for humans)

1. `npm run audit` → 24 flagged rows: 5 duplicate submissions (already ignored by
   pipeline) + 2 junk rows (ignored). Review when convenient.
2. `npm run verify-lists` → coordinator per-event CSVs have ~20 duplicate teams
   (case/format variants) and ~22 registered teams not typed in. **These CSVs are
   desk check-in sheets only — NOT website data.**
3. Project Infinity line 1 (coordinator CSV): columns shifted (phone in name field).
4. Google Form URLs in `src/data.js` are still placeholders (`fXYZ...`) — replace
   before sharing registration links publicly.
5. Contact placeholder `+91 98XXX XXXXX` still in `CONTACT_INFO`.
6. Cipher & Coin 49 MB Reel.MOV intentionally excluded (too heavy); Math Heist poster
   exists only as PDF (no image version).

---

## Deployment reality check

- **Vercel project linked** (.vercel/project.json → `convergence`) but the LIVE
  site at `convergence.vercel.app` currently serves an **OLD Next.js app**.
- Local folder is **not a git repo yet**. `.gitignore` protects `files/` +
  private `data-admin/*`; dry-run confirmed no personal data would be committed.
- To ship: either `npx vercel --prod` (CLI, immediate) or init a git repo, push to
  GitHub with Contents:Read/Write token setup for cloud admin, connect to Vercel.

### Fest-day update loop
```
enter results (admin panel)  →  npm start laptop: instant rebuild
                              →  Vercel: ☁ commit → auto-rebuild ~2 min
```
For local-laptop edits to reach Vercel: `npm run build-data && npm run build`,
commit, push (Vercel auto-deploys).

---

*Built across one long session: data pipeline, leaderboard, gallery/media, admin
server + panel (7 tools), integrity audits, GitHub cloud sync, check-in desk.*
