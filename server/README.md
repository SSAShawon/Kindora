# Kindora — Server

The backend API for **Kindora**: Express + TypeScript + Better Auth + MongoDB.
It owns authentication, authorization, events, participants, and user stats.
All role and ownership rules are enforced here — the frontend is never trusted.

## API overview

Base path: `/api`. Responses use a consistent envelope:

```jsonc
// success
{ "success": true, "data": { /* ... */ } }
// error
{ "success": false, "error": { "code": "EVENT_NOT_FOUND", "message": "…", "details": { /* optional */ } } }
```

### Auth (Better Auth, mounted at `/api/auth`)

| Method | Path                     | Description |
| ------ | ------------------------ | ----------- |
| POST   | `/api/auth/sign-up/email`| Register (name, email, password, role). Role is validated server-side. |
| POST   | `/api/auth/sign-in/email`| Sign in, issues a session cookie. |
| POST   | `/api/auth/sign-out`     | Invalidate the session. |
| GET    | `/api/auth/get-session`  | Current session + user (always fresh from the DB). |
| GET    | `/api/auth/callback/google` | Google OAuth callback (enabled when credentials are set). |

### Events

| Method | Path                  | Auth | Description |
| ------ | --------------------- | ---- | ----------- |
| GET    | `/api/events`         | —    | List with `search`, `category`, `status` (upcoming default), `sort`, `page`, `limit` (9, max 24). Returns `{ events, total, page, limit, totalPages }`. |
| GET    | `/api/events/featured`| —    | Upcoming events for the homepage featured section. |
| GET    | `/api/events/:id`     | —    | Detail: `{ event, organizer, viewerJoined, isOwner }`. |
| POST   | `/api/events`         | Organizer | Create (validated: future date, http(s) thumbnail, length limits). |
| PUT    | `/api/events/:id`     | Owner | Update own event. |
| DELETE | `/api/events/:id`     | Owner | Delete own event. |
| GET    | `/api/events/:id/participants` | — | Participant list + count. |
| POST   | `/api/events/:id/join`| Volunteer | Join once (DB-level duplicate prevention). |
| DELETE | `/api/events/:id/join`| Volunteer | Cancel own participation. |

### Users & misc

| Method | Path                          | Auth | Description |
| ------ | ----------------------------- | ---- | ----------- |
| GET    | `/api/users/me`               | Yes  | Current public profile. |
| PUT    | `/api/users/me/profile`       | Yes  | Update name/photo (email & role are fixed). |
| GET    | `/api/users/me/joined-events` | Volunteer | Events the user joined. |
| GET    | `/api/users/me/created-events`| Organizer | Events the user created. |
| GET    | `/api/users/me/stats`         | Yes  | Role-aware dashboard stats. |
| GET    | `/api/stats`                  | —    | Public platform stats (30s cache). |
| GET    | `/api/config`                 | —    | `{ googleAuthEnabled }`. |
| POST   | `/api/contact`                | —    | Contact form submission. |
| GET    | `/api/health`                 | —    | Liveness probe. |

### Authorization & status codes

- `401 UNAUTHENTICATED` — no valid session.
- `403 FORBIDDEN` / `403 NOT_EVENT_OWNER` — wrong role or not the event's creator.
- `404 EVENT_NOT_FOUND` / `404 NOT_JOINED` — missing resource/participation.
- `409 ALREADY_JOINED` / `409 DUPLICATE` — duplicate join or duplicate email.
- `400 EVENT_STARTED` / `400 OWN_EVENT` / `400 VALIDATION_ERROR` — business/validation rules.

Organizers can only edit/delete their **own** events; volunteers can only join
once and cancel their own participation. A unique compound index on
`(eventId, userId)` guarantees join-once at the database level.

## Install & run

```bash
cd server
npm install
cp .env.example .env       # fill in values (defaults work with the dev database)
npm run seed               # optional: demo users + 12 events
npm run dev                # tsx watch -> http://localhost:5000
```

For a local database without installing MongoDB, run the bundled
MongoDB-compatible dev server from the repo root:

```bash
cd ../tools/dev-mongo && npm install && node server.mjs
# then set MONGODB_URI=mongodb://127.0.0.1:27017/kindora?directConnection=true
```

### Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Watch mode (`tsx watch src/index.ts`)    |
| `npm run build`     | Compile TypeScript to `dist/`            |
| `npm start`         | Run the compiled server (`node dist/index.js`) |
| `npm run seed`      | Load demo data (`-- --reset` to wipe first, requires `ALLOW_SEED_RESET=true`) |
| `npm run typecheck` | `tsc --noEmit`                           |

## Environment variables

| Variable               | Required | Description |
| ---------------------- | -------- | ----------- |
| `MONGODB_URI`          | Yes      | MongoDB connection string (Atlas in production). |
| `MONGODB_DB_NAME`      | No       | Database name (default `kindora`). |
| `BETTER_AUTH_SECRET`   | Yes      | Strong random secret — `openssl rand -base64 32`. |
| `BETTER_AUTH_URL`      | Yes      | Public base URL used for auth cookies/redirects. |
| `CLIENT_ORIGIN`        | Yes      | Frontend origin (CORS + trusted origins). |
| `GOOGLE_CLIENT_ID`     | No       | Google OAuth client ID (button hidden until set). |
| `GOOGLE_CLIENT_SECRET` | No       | Google OAuth client secret. |
| `PORT`                 | No       | API port (default `5000`). |
| `ALLOW_SEED_RESET`     | No       | Set `true` to permit `seed --reset` to wipe data. |

Never commit `.env`. See [`.env.example`](.env.example) for a template.

## Deploy

### Render

1. Create a **Web Service** from the repo, root directory `server`.
2. Build command: `npm install && npm run build` · Start command: `npm start`.
3. Add all environment variables above (Atlas `MONGODB_URI`, strong
   `BETTER_AUTH_SECRET`, `CLIENT_ORIGIN`/`BETTER_AUTH_URL` = your public URLs).
4. Deploy. The client's `API_PROXY_TARGET` should point at this service's URL.

### Vercel (serverless)

`server/api/index.ts` exports the Express app as a serverless handler and
`server/vercel.json` rewrites all routes to it. Import the repo with root
directory `server`, add the same environment variables, and deploy.

> MongoDB Atlas is required in production (the bundled dev database is for local
> use only). Add your deployment host to Atlas' network access list.

## Project structure

```
server/src/
├── index.ts             # Entry: connect DB, start HTTP server
├── app.ts               # Express app: CORS, JSON, routes, error handler
├── config/env.ts        # Validated environment configuration
├── lib/                 # auth (Better Auth), db, http helpers, serialize
├── middleware/          # requireAuth/requireRole, centralized error handler
├── routes/              # events, users, misc (stats/config/contact/health)
├── validation/schemas.ts# Zod schemas shared by route handlers
└── scripts/             # seed.ts (demo data), api-test.mjs (52 assertions)
```
