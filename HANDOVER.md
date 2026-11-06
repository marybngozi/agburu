# Agburu — session handover (2026-11-06)

Written for a fresh Claude Code session picking this up with no memory of the Cowork conversation that produced it. Read this whole file before touching code.

## Project

Family lineage/history archive. Vue 3 + Vite frontend in `FE/`, Node/Express + MongoDB backend in `BE/`. Deployed via Cloudflare Pages (FE, `https://agburu.pages.dev/`) + Render (BE, `https://agburu.onrender.com`) + MongoDB Atlas. Repo root has `BE/` and `FE/` only, on branch `main`, no top-level README or CLAUDE.md.

## ⚠️ Uncommitted changes right now

Everything described under "Most recent work" below is **written to disk but not committed**. Run `git status` first — as of this handover it shows:

```
 M BE/src/controllers/authController.js
 M BE/src/controllers/lineageController.js
 M BE/src/middleware/authMiddleware.js
 M BE/src/models/Admin.js
 M BE/src/models/Lineage.js
 M BE/src/routes/authRoutes.js
 M BE/src/routes/lineageRoutes.js
 M BE/src/routes/personRoutes.js
 M FE/src/api/index.js
 M FE/src/composables/useAuth.js
 M FE/src/router/index.js
 M FE/src/views/HomeView.vue
 M FE/src/views/LineageCreateView.vue
 M FE/src/views/LoginView.vue
 M FE/src/views/admin/LineagesView.vue
 M FE/src/views/admin/MemberForm.vue
?? FE/src/components/admin/LineageMembersManager.vue
?? FE/src/views/MyLineagesView.vue
?? FE/src/views/SignupView.vue
```

Last commit on `main`: `63054aa` — "Fix RichTextEditor color formatting issues; ensure inline styles are overridden in ProfileView and apply scoped styles for rich text content." That one IS committed; everything above it is not. Decide with the user whether to commit, and if so, write the message yourself from what's actually staged rather than copying this file's prose verbatim.

No new npm packages were introduced in the uncommitted work — don't run `npm install` expecting new deps; there aren't any. (An earlier, already-committed round did add `@tailwindcss/vite`, `tailwindcss`, `@tailwindcss/typography` as devDependencies — that install already happened and is done.)

## Architecture, as it actually stands today

**Data model** (`BE/src/models/`):
- `Person.js` — a person record. **Not scoped to a lineage directly** — no `lineageId` field. `parentId`/`partnerIds`/`childrenIds` are plain string arrays (legacy, still used by some flows); lineage membership and parent/child/marriage *relationships within a lineage* are tracked separately (below). Has `detailedBiography` (rich HTML from Quill), `isDeleted` (soft delete).
- `Lineage.js` — one family tree. `status`: `pending` → `approved` (admin-gated) → (`rejected` unused in UI but in the enum). `visibility`: `public`/`private`. **`ownerId`** (ref `Admin`, nullable) — added this session; the account that requested it, null for pre-existing/legacy lineages.
- `LineageMember.js` — join table: `{ lineageId, personId, modeOfJoining, isRoot, isDeleted }`. A person can be a member of a lineage without any relationship yet ("not yet connected").
- `Relationship.js` — `parent_child` or `marriage` edges, scoped to a `lineageId`, with `childOrder` for sibling ordering.
- `Admin.js` — the **only** account table, despite the name. `role` enum: `platform_admin` (full access to everything), `profile_editor` (assigned to one `Person` via `assignedPersonId`, can only submit `ChangeRequest`s for that one profile, reviewed by an admin — see `userController.js`/`ChangeRequest.js`), and **`lineage_owner`** (added this session — self-signed-up, can create/manage only lineages they own).
- `AuditLog.js`, `ChangeRequest.js` — audit trail and the profile_editor change-request workflow. Unrelated to this session's work, didn't touch them.

**Auth** (`BE/src/middleware/authMiddleware.js`): JWT via `protect` (requires `Authorization: Bearer <token>`, populates `req.user`/`req.admin`). `optionalProtect` is the same but doesn't reject when there's no token. `requirePlatformAdmin` — role check. Two NEW middlewares added this session:
- `requireLineageOwnerOrAdmin` — passes for `platform_admin`, or for `lineage_owner` IF `Lineage.ownerId` matches `req.user._id`. Reads `req.params.lineageId` (every route it guards uses that param name).
- `requirePersonOwnerOrAdmin` — passes for `platform_admin`, or for `lineage_owner` IF the target `Person` (`req.params.id`) is a member of a lineage they own, OR belongs to no lineage at all yet (freshly created, not yet connected).

**Frontend auth state** (`FE/src/composables/useAuth.js`): a module-level `user` ref holding `{ token, email, username, role }`, hydrated from `localStorage` (`token`, `role` keys) on load. `login()`/`signup()` both persist session + redirect — see "redirect-aware auth" below. `logout()` clears both localStorage keys.

**Router** (`FE/src/router/index.js`): `meta.requiresAuth` gates on token presence; **new** `meta.requiresPlatformAdmin` gates `/admin`, `/admin/editors`, `/admin/lineages` on `localStorage.role === 'platform_admin'` — but only when `role` is a KNOWN non-admin value; a missing/legacy role falls through rather than wrongly bouncing a real admin whose session predates this change (see inline comment in the guard). The guard also now appends `?redirect=<path>` when sending someone to `/login`, and `useAuth`'s `login`/`signup` read that back (`redirectAfterAuth`) to return the user to where they were headed, falling back to a role-based default (`my-lineages` for `lineage_owner`, `admin-dashboard` for everyone else).

## Most recent work: public signup + lineage ownership

User's request: "we want it open for others too, signup and create lineage, and it will be up for review." Confirmed via AskUserQuestion before building: (1) a signed-up user manages only their own lineage(s) — admin keeps full access; (2) browsing stays public, no account needed to view; (3) signup is instant, no email verification for now.

**What this did NOT change:** the existing pending → `platform_admin`-approval gate on a new lineage request is untouched. A `lineage_owner`'s lineage still needs an admin to approve it before it's publicly visible/manageable — the owner just gets to populate it themselves afterward instead of handing it to the admin, which previously was the only path (only `platform_admin` could ever add members/relationships to ANY lineage).

**Backend, concretely:**
- `POST /api/auth/signup` (public, `authController.js`/`authRoutes.js`) — creates an `Admin` doc with `role: 'lineage_owner'`, instant `isApproved`/`isActive` (model defaults), returns a JWT same shape as login.
- `POST /api/lineages` (create/request a lineage) now requires `protect` (was fully open before) and stamps `ownerId: req.user._id`, `requestedBy: { name: req.user.username || req.user.email, email: req.user.email }` — the old free-text `requesterName`/`requesterEmail` body fields are gone.
- `GET /api/lineages/mine` (new) — a `lineage_owner`'s own lineages only (`Lineage.find({ ownerId: req.user._id })`), vs. `GET /api/lineages/admin/all` which stays `platform_admin`-only and lists everything.
- `GET/POST /:lineageId/members`, `POST /:lineageId/relationships`, `PATCH /:lineageId/members/:memberId/root`, `PATCH /:lineageId/parents/:parentPersonId/children-order` — swapped from `requirePlatformAdmin` to `requireLineageOwnerOrAdmin`.
- `canViewFullLineage` (in `lineageController.js`, used by `getLineageTree`) — extended so a `lineage_owner` sees full member data on a lineage they own (previously only `platform_admin` or an assigned `profile_editor` got full access; everyone else saw name+photo only).
- `personRoutes.js`: `POST /` (create a new Person) opened to any signed-in account (`protect` only — nothing to scope-check on a brand new, unowned record). `PUT /:id` and `PATCH /:id/soft-delete` gated by the new `requirePersonOwnerOrAdmin`.

**Frontend, concretely:**
- `SignupView.vue` (new) — mirrors `LoginView.vue`'s layout, posts to `api.signup`, logs in on success.
- `MyLineagesView.vue` (new, route `/my-lineages`) — a `lineage_owner`'s scoped version of `admin/LineagesView.vue`: lists only their own lineages, shows a "pending approval" banner instead of an approve button, links to the public page once approved.
- `components/admin/LineageMembersManager.vue` (new) — the "search/add a person, reorder children, members table" UI that used to live inline in `admin/LineagesView.vue` was extracted here so both `LineagesView.vue` (admin, full list + approve button) and `MyLineagesView.vue` (owner, scoped list, no approve) share one implementation instead of two copies drifting apart. Takes `:lineage` and `:return-to` props; the latter threads into `add-member`/`edit-member` links as `?returnTo=` so `MemberForm.vue` knows whether to return the caller to `admin-lineages` or `my-lineages` after creating/editing a person (`MemberForm.vue`'s own back-button and post-submit redirects now read `route.query.returnTo`, falling back to the original hardcoded `admin-dashboard`/`admin-lineages` when absent, so Dashboard's own "+ Add New Person" button — which doesn't pass `returnTo` — behaves exactly as before).
- `router/index.js` — added `/signup`, `/my-lineages`; `/create-lineage` now `requiresAuth: true`; `/admin`, `/admin/editors`, `/admin/lineages` got `requiresPlatformAdmin: true`. See the redirect/role-fallback guard logic above.
- `HomeView.vue` nav — shows "Log in" / "Sign up" when signed out; "My lineages" or "Admin dashboard" (role-dependent) when signed in, reading the shared `useAuth()` state.
- `LineageCreateView.vue` — dropped the `requesterName`/`requesterEmail` form fields (identity now comes from the logged-in account).

**Verified before committing to disk:** `node --check` on every touched file's script content, plus a template/script/style tag-balance check on every `.vue` file. All passed. **Not yet done:** no actual `npm run dev`/build/manual click-through — this sandbox can't reach the npm registry and was told never to run dev/build servers here. **This still needs a real manual test pass** (signup → create lineage → admin approves → owner adds a person and connects them → public page renders correctly) before it's trustworthy for review.

## Known follow-ups, not done

- Email verification + password reset for signup (deliberately deferred — needs a transactional email provider picked first).
- Rate-limiting the signup endpoint before this is genuinely public-facing.
- Whether a `lineage_owner` should be able to invite co-editors onto their own lineage, or stay single-owner, is undecided.
- `GET /api/people` (the global directory, powering `admin/Dashboard.vue`) has **no auth at all** — pre-existing gap, not introduced this session, but worth flagging before a wider public launch since it returns every person in the system to anyone.
- A `platform_admin` who was already logged in before this shipped has a `token` in localStorage but no `role` — the client-side admin-route guard treats that as "unknown" and lets it through (server-side `requirePlatformAdmin` is the real check regardless). It self-corrects on their next login. If the admin reports getting bounced to `/my-lineages` unexpectedly, that's the one-time cause — tell them to log out and back in.

## Earlier work this session (already committed, commit `63054aa` and before)

In rough order, for context if asked about any of it:
1. SEO pass + dynamic per-page titles (`useDocumentMeta.js`), WYSIWYG biography editor (`RichTextEditor.vue`, Quill loaded from CDN — deliberately NOT an npm dependency, to avoid lockfile risk on Cloudflare's `npm clean-install` build step), searchable dropdown (`SearchableSelect.vue`) + paginated members table.
2. Full Tailwind CSS v4 migration of the entire FE (`@tailwindcss/vite` plugin, CSS-first config in `src/assets/main.css` — custom `forest`/`clay`/`sand` color ramps, `@custom-variant dark` wired to the app's actual `data-theme="dark"` attribute mechanism, shared `.btn-primary`/`.card`/etc. component classes via `@apply`). Fixed a real pre-existing bug in the process: `main.css` had been completely empty, so dark mode was inert app-wide before this.
3. Bugfix round: the profile page's embedded family tree didn't match the home page's tree visually — root-caused to `useLineage.js` using a different layout algorithm (`dagre`, a layered-graph library) than `LineageMapView.vue` (`d3-hierarchy`'s tree algorithm). Fixed by replacing `useLineage.js`'s `calculateLayout` with the same d3-hierarchy approach at the same `nodeSize`, removing the now-unused `dagre` dependency.
4. Bugfix round: biography text rendered black and unreadable in dark mode. Root cause, confirmed via the user's own DevTools inspection: Quill was baking a literal inline `style="color: rgb(0, 0, 0)"` onto spans in saved biography HTML (almost always from pasting content in from Word/Google Docs) — no class-based CSS, however specific, can beat an element's own inline `style` attribute without `!important`. Fixed two ways: (a) `RichTextEditor.vue` now passes a `formats` whitelist to Quill (header/bold/italic/underline/list/blockquote/link only — matching the toolbar) so new typing/pasting can never introduce color again, plus a scoped `!important` CSS rule neutralizing any inline color already present in loaded content; (b) `ProfileView.vue`'s read-only biography render got the equivalent `!important` CSS rule (`.rich-text-content :deep([style*="color"]) { color: inherit !important; }`) for already-saved records. Note: existing bad records in the database aren't rewritten by this — the CSS neutralizes the symptom at render time; re-saving a record through the editor would also clean it going forward now that the `formats` whitelist exists.

## Suggested next steps

1. `git diff` the uncommitted changes above, do the manual test pass described, then commit.
2. Push and let Cloudflare Pages / Render redeploy (both are connected to this repo per earlier deploy setup — FE auto-deploys from `main` on push, BE on Render likewise).
3. Tackle "Known follow-ups" in whatever order the user prioritizes — email verification before a truly public launch is the one I'd flag hardest.
