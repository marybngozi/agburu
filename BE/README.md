# Agburu — Backend (API)

Express 5 + MongoDB (Mongoose 9) REST API for the Agburu family-tree platform. Deployed on Render, database on MongoDB Atlas, images on Cloudinary.

## Quick start

```bash
cd BE
npm install
cp .env.example .env   # or create .env (see below)
npm run dev            # nodemon, http://localhost:5000
```

The API needs a MongoDB **replica set** (Atlas, or a local single-node replica set) because lineage writes use transactions. A plain standalone `mongod` will fail on those routes.

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | Port to listen on |
| `MONGO_URI` | MongoDB connection string (replica set) |
| `JWT_SECRET` | Secret for signing 7-day login tokens |
| `FRONTEND_URL` | Allowed CORS origin(s) for the deployed frontend |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Profile picture uploads |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Used by `seedAdmin.js` to create the first platform admin |
| `LEGACY_LINEAGE_NAME`, `LEGACY_LINEAGE_SLUG`, `LEGACY_LINEAGE_CONTACT_EMAIL` | Used only by the legacy migration script |

`.env` is git-ignored. Never point a local `.env` at the production database when testing.

## Scripts

| Command | What it does |
|---|---|
| `npm start` | Run the server (production) |
| `npm run dev` | Run with nodemon |
| `node src/seedAdmin.js` | Create the admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` if missing. Never deletes accounts. Add `--reset-password` to change an existing admin's password |
| `npm run set-person-slug -- <personId> <slug>` | Give a person a URL slug (e.g. `basil-umeh`) |
| `npm run migrate:legacy-lineage` | One-off migration of old parent/child fields into lineages and relationships |

## Structure

```
src/
  server.js        loads dotenv first, connects to Mongo, starts the app
  app.js           helmet, CORS, rate limits, routes, JSON 404 and error handler
  config/          DB and Cloudinary setup
  models/          Admin, Person, Lineage, LineageMember, Relationship, ...
  controllers/     auth, person, lineage, user (editors, change requests)
  routes/          route definitions and middleware wiring
  middleware/      protect, optionalProtect, role and ownership checks
  utils/           sanitize.js (rich text), slugs.js, access.js (visibility)
```

## Data model

- **Person**: a profile. `createdBy` records the owner. Legacy `parentId`/`childrenIds`/`partnerIds` are derived from `Relationship` at read time.
- **Lineage**: a named family tree with a unique `slug`, visibility (public/private) and approval status.
- **LineageMember**: joins a person to a lineage (one member can be the root).
- **Relationship**: `parent_child` or `marriage` between two people in a lineage, with `childOrder`.

## Roles and access

- `platform_admin`: sees and edits everything, approves lineages, manages profile editors.
- `lineage_owner`: signs up, requests a lineage, and manages only the people they created.
- `profile_editor`: submits change requests for an assigned person.

Anonymous visitors can read only people in public, approved lineages. Private data returns 404.

## API overview

Base path `/api`. `GET /health` returns `{ ok: true }` (use it for keep-alive pings).

- **Auth**: `POST /auth/login`, `POST /auth/signup`, `GET /auth/me`
- **People**: `GET /people` (auth), `POST /people/by-ids`, `GET /people/:idOrSlug`, `POST /people`, `PUT /people/:id`, `PATCH /people/:id/soft-delete`
- **Lineages**: `GET /lineages`, `POST /lineages`, `GET /lineages/mine`, `GET /lineages/:slug/tree`, member and relationship routes under `/lineages/:lineageId/...`, admin routes under `/lineages/admin/...`
- **Users (admin)**: profile editors and change requests

## Security notes

Rich text is sanitised server-side (sanitize-html). Fields are whitelisted on write, regex input is escaped, and login input must be strings. Rate limits: 600 requests per 15 minutes overall, 20 logins per 15 minutes, 10 signups per hour. Uploads are image-only, 5MB maximum. Slugs are 3–60 chars with a reserved list (`admin`, `login`, `api`, ...).

## Deploy (Render)

Build command `npm install`, start command `npm start`, and set all environment variables above. The free tier sleeps when idle, so ping `/health` every ~5 minutes or use a paid plan.
