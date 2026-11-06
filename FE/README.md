# Agburu — Frontend

Vue 3 + Vite 5 single-page app with Tailwind CSS v4. It shows interactive family trees and gives lineage owners and admins tools to manage them. Deployed on Cloudflare.

## Quick start

```bash
cd FE
npm install
npm run dev      # http://localhost:5173
```

By default the app calls `http://localhost:3010/api`. To use a different backend, create `FE/.env.local`:

```
VITE_API_BASE=http://localhost:5000/api
```

`VITE_API_BASE` is read at **build time**, so set it in Cloudflare's build settings for deployments.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Generates the sitemap, then builds to `dist/` |
| `npm run preview` | Serves the built `dist/` locally |

## Structure

```
src/
  main.js              app setup, 401 handler, error toasts
  App.vue              router view plus global feedback (toasts, "waking server" banner)
  router/              routes and auth guards
  api/index.js         all backend calls; throws ApiError on failure
  composables/         useAuth (session), useNotifications (toasts, wake banner)
  components/
    ui/                AppShell (header), AppFeedback, RichTextEditor, ThemeToggle
    admin/             LineageMembersManager
  views/               Home, Login, Signup, Profile, LineageMap, MyLineages,
                       LineageCreate, NotFound
  views/admin/         Dashboard, MemberForm, LineagesView, EditorsView
  utils/               sanitizeHtml (DOMPurify for biographies)
scripts/generate-sitemap.js
public/_redirects      SPA fallback
wrangler.jsonc         Cloudflare static assets config
```

## Routes

| Path | Page |
|---|---|
| `/` | Home, list of public lineages |
| `/:slug` | Lineage tree map |
| `/profile/:id` | Person profile (accepts an id or slug, e.g. `/profile/basil-umeh`) |
| `/login`, `/signup` | Authentication |
| `/my-lineages`, `/create-lineage` | Lineage owner tools |
| `/admin`, `/admin/add-member`, `/admin/edit-member/:id` | Member management |
| `/admin/editors`, `/admin/lineages` | Platform admin only |
| anything else | 404 page |

## Behaviour worth knowing

- **Cold starts:** if the API takes longer than 3.5 seconds, a "Waking the server up…" banner appears.
- **Expired sessions:** a 401 clears the session and returns the user to login, then back to the page they were on.
- **Rich text:** biographies use Quill (loaded from a CDN with SRI hashes in `RichTextEditor.vue`; regenerate the hashes when changing the version) and are cleaned with DOMPurify before display.
- **Public reads:** if a stale token fails on a public page, the request is retried anonymously.

## Deploy (Cloudflare)

Build command `npm run build`, output directory `dist`. Set `VITE_API_BASE` to the deployed API URL (ending in `/api`). `public/_redirects` and `wrangler.jsonc` make deep links fall back to `index.html`. Deploy the backend first when the API changes.
