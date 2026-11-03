# Kindora

**Small Acts. Stronger Communities.**

Kindora is a full-stack volunteering platform that connects everyday volunteers
with local organizers running community events — riverbank cleanups, tree
plantation drives, donation camps, evening schools, health outreach, and more.
Volunteers discover and join events; organizers create and manage them, track
participants, and see their impact grow.

This is a complete, working application — real authentication, a real MongoDB
data layer, backend-enforced authorization, and a polished, responsive UI in
both light and dark themes. It is not a visual prototype.

---

## Monorepo layout

```
Kindora/
├── client/            Next.js 15 (App Router) frontend — deploy to Vercel
├── server/            Express + Better Auth + MongoDB API — deploy to Render or Vercel
├── tools/dev-mongo/   Zero-dependency local MongoDB-compatible dev database
└── README.md          You are here
```

The client and server are **independently deployable**. The browser only ever
talks to the Next.js origin via relative `/api/...` URLs; Next.js proxies those
to the Express API, which keeps session cookies same-origin in every environment.

## Tech stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui-style components, Radix UI, Lucide icons, React Hook Form + Zod, Sonner toasts, next-themes |
| Backend  | Node.js, Express 4, TypeScript, Better Auth (email/password + Google OAuth), MongoDB (native driver) |
| Database | MongoDB Atlas (production) · bundled MongoDB-compatible dev server (local) |
| Fonts    | Manrope (display) + Inter (body), self-hosted via Fontsource |

## Features

- **Real authentication** — email/password registration with strength checks and
  duplicate-email prevention, optional Google OAuth, persistent sessions that
  survive refresh, and protected routes that never bounce a user while a session
  is still restoring.
- **Two roles, enforced on the backend** — Volunteers browse, search, filter,
  join, and cancel; Organizers create, edit, and delete **their own** events and
  see participant stats. Ownership and role checks live in the API, not just the UI.
- **Discover events** — live search across title/description/location/organizer
  combined with exact category filters, result counts, clear-filters, and
  loading/empty/error states.
- **Event lifecycle** — validated create/edit forms (future date, http(s) image
  URL, length limits), custom delete confirmation, join-once with duplicate
  prevention at the database level, and live participant counts.
- **Role-aware dashboards** — overview stats, joined events, manage events, and
  an editable profile.
- **Premium, responsive UI** — editorial homepage with real DB impact stats,
  photo gallery with lightbox, about/contact pages, a genuinely designed dark
  theme, and a mobile-first layout with no horizontal overflow.
- **Resilient imagery** — real Pexels photography served from a CDN, with a
  bundled local copy of every photo as an automatic fallback, so a broken or
  blocked CDN never shows a broken image.

## Quick start (local)

You need **Node.js 20+**. Three terminals:

```bash
# 1. Start the local MongoDB-compatible dev database (no MongoDB install needed)
cd tools/dev-mongo
npm install
node server.mjs            # listens on mongodb://127.0.0.1:27017

# 2. Start the API
cd server
npm install
cp .env.example .env       # defaults work with the dev database
npm run seed               # loads demo organizers, volunteers, and 12 events
npm run dev                # http://localhost:5000

# 3. Start the client
cd client
npm install
cp .env.example .env.local # defaults proxy /api -> http://127.0.0.1:5000
npm run dev                # http://localhost:3000
```

Open **http://localhost:3000**.

> Prefer a real MongoDB? Point `MONGODB_URI` in `server/.env` at your local
> `mongod` or an Atlas cluster instead of running `tools/dev-mongo`.

### Demo accounts

The seed creates sample data (clearly labeled **Sample** in the UI). Password for
all demo accounts: `Kindora#Demo1`

| Role      | Email                  |
| --------- | ---------------------- |
| Organizer | ayesha@kindora.demo    |
| Organizer | tanvir@kindora.demo    |
| Volunteer | nusrat@kindora.demo    |
| Volunteer | rafiq@kindora.demo     |
| Volunteer | sadia@kindora.demo     |
| Volunteer | imran@kindora.demo     |

The login page also has one-click **Volunteer demo** / **Organizer demo** fill
buttons.

## Testing

```bash
# Backend: 52 end-to-end API assertions (auth, roles, ownership, joins, validation)
cd server && node scripts/api-test.mjs

# Dev database wire-protocol smoke tests
cd tools/dev-mongo && node smoke-test.mjs

# Type safety
cd server && npm run typecheck
cd client && npm run typecheck

# Production builds
cd server && npm run build
cd client && npm run build
```

A headless-browser UI suite (Playwright) additionally exercises registration,
session persistence, search + filter, join/cancel, the full organizer
create/edit/delete lifecycle, profile edits, the auth guard, contact form,
gallery lightbox, theme toggle, and mobile layout.

## Deployment

- **Client → Vercel.** Set `API_PROXY_TARGET` to your deployed API URL.
- **Server → Render** (build `npm run build`, start `npm start`) **or Vercel**
  (`server/api/index.ts` + `server/vercel.json` are included). Use MongoDB Atlas
  for `MONGODB_URI`, set a strong `BETTER_AUTH_SECRET`, and set `CLIENT_ORIGIN`
  and `BETTER_AUTH_URL` to your public URLs.

See [`client/README.md`](client/README.md) and [`server/README.md`](server/README.md)
for full environment-variable references and step-by-step deployment guides.

## License

MIT — build something kind.
