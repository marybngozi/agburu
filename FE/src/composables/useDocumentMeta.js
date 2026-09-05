// Lightweight document <title> / <meta name="description"> updater.
//
// This is a client-rendered SPA with no server-side rendering or
// prerendering, so this composable only helps: browser tabs, browser
// history/bookmarks, and crawlers that execute JavaScript (Google's does).
// Link-preview bots for WhatsApp/Facebook/Twitter generally do NOT run
// JavaScript, so they only ever see the static <meta> tags baked into
// index.html at build time — a shared link to a specific lineage or person
// page will preview with the site's general title/image, not that page's
// own. Real per-page social-preview cards would need server-side rendering
// or per-route prerendering, which is a much larger change than this pass;
// this covers what's achievable without one.

const SITE_NAME = "Agburu";
const DEFAULT_TITLE = "Agburu — Family Lineage Archive";
const DEFAULT_DESCRIPTION =
  "Agburu is a family lineage archive — explore family trees, member profiles, and the stories that connect generations.";

let descriptionTagEl = null;

function getDescriptionTag() {
  if (descriptionTagEl && document.head.contains(descriptionTagEl)) {
    return descriptionTagEl;
  }
  descriptionTagEl = document.querySelector('meta[name="description"]');
  if (!descriptionTagEl) {
    descriptionTagEl = document.createElement("meta");
    descriptionTagEl.setAttribute("name", "description");
    document.head.appendChild(descriptionTagEl);
  }
  return descriptionTagEl;
}

/**
 * Sets the browser tab title and the page's meta description.
 * @param {string} [title] - Full title, e.g. "Umeghigido · Agburu". Falls
 *   back to the site default when omitted (a route with no dynamic data
 *   yet, or one that doesn't need a custom title).
 * @param {string} [description] - Falls back to the site's general
 *   description when omitted.
 */
export function setPageTitle(title, description) {
  document.title = title || DEFAULT_TITLE;
  getDescriptionTag().setAttribute("content", description || DEFAULT_DESCRIPTION);
}

/** Builds the "<page> · Agburu" suffix pattern used across interior pages. */
export function withSiteSuffix(title) {
  return title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
}
