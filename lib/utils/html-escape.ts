/**
 * HTML Escaping Utility
 * 
 * Type-safe utility for escaping HTML special characters to prevent XSS attacks.
 * Can be used for email templates, user-generated content, etc.
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * 
 * @param text - Text to escape
 * @returns Escaped HTML-safe string
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

