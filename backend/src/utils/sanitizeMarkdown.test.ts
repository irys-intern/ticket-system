import { describe, it, expect } from 'vitest';
import { sanitizeMarkdown } from './sanitizeMarkdown.ts';

describe('sanitizeMarkdown', () => {
  it('keeps allowed formatting tags', () => {
    const input = '<h1>Title</h1><p>Some <strong>bold</strong> and <em>italic</em> text.</p>';
    expect(sanitizeMarkdown(input)).toBe(input);
  });

  it('strips script tags and their contents', () => {
    const input = '<p>hello</p><script>alert("xss")</script>';
    expect(sanitizeMarkdown(input)).toBe('<p>hello</p>');
  });

  it('strips event handler attributes', () => {
    const input = '<p onclick="alert(1)">click me</p>';
    expect(sanitizeMarkdown(input)).toBe('<p>click me</p>');
  });

  it('strips javascript: URIs from links', () => {
    const input = '<a href="javascript:alert(1)">bad link</a>';
    expect(sanitizeMarkdown(input)).toBe('<a>bad link</a>');
  });

  it('allows http/https links with safe attributes', () => {
    const input = '<a href="https://example.com" target="_blank" rel="noopener">link</a>';
    expect(sanitizeMarkdown(input)).toBe(input);
  });

  it('discards disallowed tags but keeps their text content', () => {
    const input = '<iframe src="https://evil.example"></iframe><p>safe</p>';
    expect(sanitizeMarkdown(input)).toBe('<p>safe</p>');
  });
});
