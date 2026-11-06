import sanitizeHtml from 'sanitize-html';

// Biographies are authored in the Quill editor (see FE RichTextEditor.vue)
// and later rendered with v-html, so anything outside Quill's own output is
// stripped here before it is ever stored. The allowlist mirrors the editor's
// toolbar: headings, bold/italic/underline, lists, blockquote and links.
// Quill 2 marks bullet items as <li data-list="bullet"> and inserts an empty
// <span class="ql-ui"> inside each item, so those two are allowed through —
// everything else (scripts, event handlers, inline styles, iframes, data:
// and javascript: URLs) is removed.
const RICH_TEXT_OPTIONS = {
  allowedTags: ['h1', 'h2', 'h3', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'a', 'span'],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    li: ['data-list'],
    span: ['class', 'contenteditable']
  },
  allowedClasses: { span: ['ql-ui'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer nofollow' })
  }
};

export const sanitizeRichText = (value) => {
  if (typeof value !== 'string' || !value) return '';
  return sanitizeHtml(value, RICH_TEXT_OPTIONS);
};
