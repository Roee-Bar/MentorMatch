/**
 * Email Styles
 * SERVER-ONLY: This file must ONLY be imported in API routes (server-side)
 * 
 * Email-specific style constants that map to Tailwind design system.
 * Note: Email clients require inline styles, so we use hex values
 * that correspond to our Tailwind color palette.
 */

// ============= COLOR MAPPINGS (Tailwind → Hex) =============
export const emailColors = {
  // Blue (primary brand color)
  blue600: '#2563eb',  // Tailwind blue-600
  blue700: '#1d4ed8',  // Tailwind blue-700
  
  // Gray scale
  gray50: '#f9fafb',   // Tailwind gray-50
  gray100: '#f3f4f6',  // Tailwind gray-100
  gray200: '#e5e7eb',  // Tailwind gray-200
  gray500: '#6b7280',  // Tailwind gray-500
  gray600: '#4b5563',  // Tailwind gray-600
  gray700: '#374151',  // Tailwind gray-700
  gray800: '#1f2937',  // Tailwind gray-800
  gray900: '#111827',  // Tailwind gray-900
  
  // White
  white: '#ffffff',
} as const;

// ============= TYPOGRAPHY =============
export const emailTypography = {
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  lineHeight: '1.6',
  
  // Font sizes (matching Tailwind scale)
  textSm: '14px',    // text-sm
  textBase: '15px',  // text-base (approx)
  textLg: '16px',    // text-lg
  textXl: '24px',    // text-xl
} as const;

// ============= SPACING (matching Tailwind scale) =============
export const emailSpacing = {
  xs: '8px',   // 2 (0.5rem)
  sm: '16px',  // 4 (1rem)
  md: '20px',  // 5 (1.25rem)
  lg: '24px',  // 6 (1.5rem)
  xl: '32px',  // 8 (2rem)
} as const;

// ============= REUSABLE STYLE OBJECTS =============
export const emailStyles = {
  body: {
    fontFamily: emailTypography.fontFamily,
    lineHeight: emailTypography.lineHeight,
    color: emailColors.gray800,
    margin: '0',
    padding: '0',
    backgroundColor: emailColors.gray100,
  },
  
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: emailSpacing.sm,
  },
  
  card: {
    backgroundColor: emailColors.white,
    borderRadius: '8px',
    padding: `${emailSpacing.xl} ${emailSpacing.lg}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  
  heading: {
    color: emailColors.blue600,
    marginTop: '0',
    marginBottom: emailSpacing.sm,
    fontSize: emailTypography.textXl,
    fontWeight: '600',
  },
  
  paragraph: {
    margin: '0 0 16px 0',
    fontSize: emailTypography.textLg,
  },
  
  paragraphMuted: {
    margin: '0 0 24px 0',
    fontSize: emailTypography.textLg,
    color: emailColors.gray600,
  },
  
  infoBox: {
    backgroundColor: emailColors.gray50,
    padding: emailSpacing.md,
    borderRadius: '6px',
    margin: `${emailSpacing.lg} 0`,
    borderLeft: `4px solid ${emailColors.blue600}`,
  },
  
  infoBoxLabel: {
    color: emailColors.gray900,
    fontSize: emailTypography.textBase,
    margin: `${emailSpacing.xs} 0`,
  },
  
  infoBoxValue: {
    color: emailColors.gray700,
    fontSize: emailTypography.textBase,
    margin: `${emailSpacing.xs} 0`,
  },
  
  footer: {
    marginTop: emailSpacing.xl,
    paddingTop: emailSpacing.lg,
    borderTop: `1px solid ${emailColors.gray200}`,
    color: emailColors.gray500,
    fontSize: emailTypography.textSm,
  },
} as const;

// ============= HELPER: Convert style object to inline string =============
/**
 * Convert a style object with camelCase properties to an inline CSS string
 * 
 * @param styles - Object with camelCase CSS property names and string values
 * @returns Inline CSS string with kebab-case properties
 * 
 * @example
 * styleObjectToString({ backgroundColor: '#fff', marginTop: '10px' })
 * // Returns: "background-color: #fff; margin-top: 10px;"
 */
export function styleObjectToString(styles: Record<string, string>): string {
  return Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebabKey}: ${value}`;
    })
    .join('; ');
}

