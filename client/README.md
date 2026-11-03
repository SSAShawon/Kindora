# Kindora — Client

The frontend for **Kindora**, a volunteering platform: *Small Acts. Stronger
Communities.* Built with the Next.js App Router and a hand-tuned design system.

## Live URL

> Not deployed yet. After deploying to Vercel, record the production URL here
> (e.g. `https://kindora.vercel.app`). Locally the app runs at
> **http://localhost:3000**.

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** with a custom burgundy/blush design-token system
- **shadcn/ui-style** component kit on **Radix UI** primitives
- **Lucide** icons (no emoji icons)
- **React Hook Form** + **Zod** for validated forms
- **Better Auth** client for sessions
- **Sonner** for toasts, **next-themes** for light/dark
- **Fontsource** self-hosted **Manrope** (display) + **Inter** (body)

## Features

1. **Editorial homepage** — split hero, real database impact stats, about,
   featured events, a four-step "how it works", community impact, a 10-photo
   gallery with lightbox, testimonials (labeled illustrative), and a final CTA.
2. **Explore Events** — live search (title/description/location/organizer)
   combined with exact category filters, URL-synced state, result counts,
   clear-filters, and loading/empty/error states.
3. **Event details** — cover image, meta, organizer, guidelines, participant
   list/count, and a join panel that updates button state, prevents duplicate
   joins, and redirects unauthenticated users to login while preserving the
   intended destination.
4. **Organizer tools** — validated create/edit event forms (future date, http(s)
   thumbnail URL, length limits) with live preview, and delete via a custom
   confirmation dialog (no `window.alert`).
5. **Role-aware dashboard** — overview stats, joined events, manage events, and
   an editable profile, all guarded by role with friendly fallbacks.
6. **Real auth UX** — registration with a password-strength meter and role
   selection, login with inline validation and demo quick-fill, persistent
   sessions, and an auth guard that never redirects while a session is restoring.
7. **Premium light & dark themes** — a genuinely designed dark palette (not an
   inversion), a theme toggle, and a fully responsive mobile layout with a
   slide-down menu and no horizontal overflow.
8. **Resilient images** — `SmartImage` loads CDN-optimized Pexels photos and
   automatically falls back to a bundled local copy (then a branded SVG), so a
   blocked or broken CDN never renders a broken image.

## Install & run

```bash
cd client
npm install
cp .env.example .env.local   # API_PROXY_TARGET defaults to http://127.0.0.1:5000
npm run dev                  # http://localhost:3000
```

The API must be running (see [`../server/README.md`](../server/README.md)). The
browser only calls relative `/api/...` URLs; `next.config.ts` proxies them to
`API_PROXY_TARGET`, keeping cookies same-origin.

### Scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server on `0.0.0.0:3000` |
| `npm run build`     | Production build                     |
| `npm start`         | Serve the production build           |
| `npm run lint`      | Next.js lint                         |
| `npm run typecheck` | TypeScript check (`tsc --noEmit`)    |

## Environment variables

| Variable           | Required | Description |
| ------------------ | -------- | ----------- |
| `API_PROXY_TARGET` | No       | Backend origin the `/api` proxy forwards to. Defaults to `http://127.0.0.1:5000`. Set to your deployed API URL in production. |

No secrets live in the client. All backend URLs and credentials stay server-side.

## Deploy to Vercel

1. Import the repository and set the **Root Directory** to `client`.
2. Framework preset: **Next.js** (auto-detected).
3. Add the environment variable `API_PROXY_TARGET=https://<your-api-host>`.
4. Deploy. All routes are App Router pages, so refresh/direct access works.

## Project structure

```
client/src/
├── app/                 # App Router pages (home, events, auth, dashboard, about, gallery, contact)
├── components/
│   ├── ui/              # Reusable design-system primitives
│   ├── layout/          # Navbar, footer, logo, theme toggle
│   ├── shared/          # SmartImage, states, badges, dialogs, guards
│   ├── home/            # Homepage sections
│   ├── events/          # Event card, explore, join panel, event form
│   ├── auth/            # Auth layout, Google button
│   ├── dashboard/       # Shell, stat card, activity list
│   └── gallery/         # Gallery grid + lightbox
├── hooks/               # use-api, use-debounce
└── lib/                 # api client, auth client, types, validators, constants, images, utils
```
