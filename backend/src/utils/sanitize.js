// Lightweight XSS sanitization for user-submitted text fields.
// We don't allow any HTML in our content (descriptions are rendered as plain
// text, not as innerHTML), so stripping all tags is safe and correct.
//
// This is intentionally a zero-dependency solution. If you later want to allow
// a limited subset of HTML (bold, lists, links) in job descriptions, swap this
// for `sanitize-html` (npm package) with an allowlist.

/**
 * Strips all HTML/XML tags from a string and trims whitespace.
 * Returns the original value unchanged if it isn't a string.
 * @param {unknown} value
 * @returns {unknown}
 */
function stripTags(value) {
  if (typeof value !== 'string') return value
  return value
    .replace(/<[^>]*>/g, '')   // strip HTML tags
    .replace(/&lt;/gi, '<')    // decode common HTML entities so they show as text
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .trim()
}

/**
 * Sanitize a plain object's string values in place.
 * Only processes keys that are in the allowedKeys list (if provided).
 *
 * Usage in a route:
 *   const { sanitizeFields } = require('../utils/sanitize')
 *   sanitizeFields(req.body, ['title', 'description', 'bio'])
 *
 * @param {object} obj
 * @param {string[]} [keys] — if omitted, sanitizes ALL string values
 */
function sanitizeFields(obj, keys) {
  if (!obj || typeof obj !== 'object') return
  const targets = keys || Object.keys(obj)
  for (const key of targets) {
    if (typeof obj[key] === 'string') {
      obj[key] = stripTags(obj[key])
    }
  }
}

// Escape special regex characters to prevent ReDoS injection
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

module.exports = { stripTags, sanitizeFields, escapeRegex }
