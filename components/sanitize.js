/**
 * Helpers for putting untrusted values into HTML.
 *
 * App names, developer names and icon URLs come from the App Store / Play Store,
 * analysis text comes from the AI backend, and some values come from the page URL.
 * None of them may be written into innerHTML as-is.
 */

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape a value for use in HTML text or in a quoted attribute value.
 * null / undefined become an empty string.
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
}

/**
 * Return the URL if it is http(s), otherwise ''. Blocks javascript:, data: and the like
 * for values used in href / src / CSS url(). The result still needs escapeHtml()
 * when it is placed inside an HTML string.
 */
export function safeUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(String(value), window.location.origin);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

/**
 * CSS background-image value for an untrusted image URL ('none' when unsafe).
 * Safe to place inside a double-quoted style attribute.
 */
export function cssUrl(value) {
  const url = safeUrl(value);
  return url ? `url(${JSON.stringify(url)})`.replace(/"/g, '&quot;') : 'none';
}
