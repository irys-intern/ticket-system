import sanitizeHtml from 'sanitize-html';

// Training material markdown may legitimately contain inline HTML for formatting,
// but must never carry executable content (script tags, event handlers, javascript: URIs).
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'a', 'ul', 'ol', 'li', 'blockquote',
  'b', 'i', 'strong', 'em', 'strike', 's',
  'code', 'pre', 'hr', 'br', 'div', 'span',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img',
];

const ALLOWED_ATTRIBUTES = {
  a: ['href', 'name', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  '*': ['class'],
};

export function sanitizeMarkdown(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https'] },
    disallowedTagsMode: 'discard',
  });
}
