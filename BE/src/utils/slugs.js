// Paths the frontend router already uses. Lineages live at the root level
// (/:slug), so a lineage slug equal to one of these would be unreachable —
// or worse, shadow a real page.
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'login', 'logout', 'signup', 'register', 'my-lineages',
  'create-lineage', 'profile', 'assets', 'static', 'public', 'health',
  'favicon', 'robots', 'sitemap', 'index', 'home', 'about', 'settings',
  'dashboard', 'editors', 'lineages', 'lineage', 'people', 'person', 'null', 'undefined'
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const toSlug = (value = '') => String(value).toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

// Returns an error message, or null when the slug is usable.
export const validateSlug = (slug) => {
  if (!slug) return 'A URL slug is required';
  if (slug.length < 3 || slug.length > 60) return 'The URL slug must be 3–60 characters';
  if (!SLUG_PATTERN.test(slug)) return 'The URL slug may only contain lowercase letters, numbers and hyphens';
  if (RESERVED_SLUGS.has(slug)) return 'That URL is reserved — please choose a different one';
  return null;
};
