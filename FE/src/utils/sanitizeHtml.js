import DOMPurify from 'dompurify';

// Biographies are stored as HTML and rendered with v-html. The server
// sanitizes on write, but records saved before that existed may still hold
// unsafe markup, so everything is sanitized again at render time.
let hookInstalled = false;
const installHook = () => {
  if (hookInstalled) return;
  hookInstalled = true;
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName === 'A') {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  });
};

export const sanitizeBiography = (html) => {
  if (!html) return '';
  installHook();
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'a', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'data-list'],
    ALLOW_DATA_ATTR: false,
  });
};
