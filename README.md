# CONVERGENCE 2026 — Fest Website

## Running the site + Admin Panel

```
npm start
```

Then open:
- **Site**: http://localhost:3001/
- **Admin panel**: http://localhost:3001/#/admin (default password: `convergence26`, override with `ADMIN_PASSWORD` env var)

## Editing from anywhere (Vercel, no laptop needed)

The admin panel works on the deployed Vercel site too (`convergence.vercel.app/#/admin`):

- **Login with a GitHub fine-grained token** instead of the password
  (create at github.com → Settings → Developer settings → Fine-grained tokens,
  select this repository only, permission: Contents = Read/Write)
- **Enter Results** and **Edit Events** commits straight to the repo →
  Vercel rebuilds automatically → leaderboard live in ~2 minutes
- **Check-In** also works on Vercel: searches the bundled roster (names + colleges,
  no contact info), batches check-in marks on-device, and syncs them to GitHub
  with one tap. Unknown student? Quick-add as on-spot (public-safe fields only).
- Registrations / On-Spot / Import still need the laptop server
  (they read the private registration files)

Setup: open admin on Vercel → ☁ GitHub Sync → enter owner/repo/branch + token → Save & Test.

## Local-only workflow (unchanged)

The admin panel lets core members:
- **Edit Events** — name, prizes, venue, date/time, rules, poster, Google Form link (saved + site rebuilt automatically)
- **Enter Results** — pick an event, add rank rows per team/college; leaderboard points are auto-calculated
- **Registrations** — browse all 180 online registrations with contact details (private — never shown publicly)

Every save regenerates the data and rebuilds the site in ~0.2s — just refresh the public page.

## Updating data from raw files

1. Drop updated files into `files/`: registration XLSX + participants CSV (+ optional `scores.csv`)
2. Run `npm run build-data && npm run build`

---

## Updating Leaderboard / Participants Data

1. Drop updated registration files into `files/`:
   - `Convergence 2026 Registration Form (Responses).xlsx`
   - `Participants - Sheet1.csv`
2. For results, edit `files/scores.csv` (copy `scores.template.csv`). Each row:
   - `College,Team,Event,Rank` — e.g. `Alliance University,The Primes,Cipher & Coin,1`
   - or `College,Team,Event,Score` — ranks are derived automatically
3. Run:
   ```
   npm run build-data
   npm run build
   ```
4. Deploy (Vercel picks up automatically on push).

Note: participant phone numbers and emails are never published — only names and colleges.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
