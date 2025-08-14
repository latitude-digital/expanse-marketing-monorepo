/**
 * WCAG AA Color Contrast Utilities
 * 
 * This utility provides functions to validate color contrast ratios
 * against WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
 */

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

/**
 * Calculate relative luminance of a color
 * Formula from WCAG 2.1 specification
 */
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * Returns a ratio where higher is better contrast
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format. Please use hex colors (e.g., #ffffff)');
  }
  
  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG AA standards
 */
export function meetsWCAGAA(
  foreground: string, 
  background: string, 
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 3 : 4.5;
  return ratio >= requiredRatio;
}

/**
 * Check if color combination meets WCAG AAA standards
 */
export function meetsWCAGAAA(
  foreground: string, 
  background: string, 
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatio = isLargeText ? 4.5 : 7;
  return ratio >= requiredRatio;
}

/**
 * Get accessibility compliance level for a color combination
 */
export function getAccessibilityLevel(
  foreground: string, 
  background: string, 
  isLargeText: boolean = false
): 'FAIL' | 'AA' | 'AAA' {
  if (meetsWCAGAAA(foreground, background, isLargeText)) return 'AAA';
  if (meetsWCAGAA(foreground, background, isLargeText)) return 'AA';
  return 'FAIL';
}

/**
 * Predefined WCAG AA compliant color combinations used in LoginForm
 */
export const WCAG_AA_COLORS = {
  // Primary text colors (7:1 contrast ratio)
  textPrimary: '#111827', // gray-900
  textSecondary: '#374151', // gray-700
  textMuted: '#6B7280', // gray-500
  
  // Error colors (7:1+ contrast ratio)  
  errorText: '#991B1B', // red-800
  errorBorder: '#DC2626', // red-600
  errorBackground: '#FEF2F2', // red-50
  
  // Success colors (7:1+ contrast ratio)
  successText: '#166534', // green-800
  successBorder: '#16A34A', // green-600
  successBackground: '#F0FDF4', // green-50
  
  // Button colors (4.5:1+ contrast ratio)
  buttonPrimary: '#1D4ED8', // blue-700
  buttonPrimaryHover: '#1E3A8A', // blue-800
  buttonPrimaryText: '#FFFFFF', // white
  
  // Focus colors (3:1+ contrast ratio for focus indicators)
  focusRing: '#3B82F6', // blue-500 (improved contrast: 3.68:1)
  focusRingOffset: '#FFFFFF', // white
  
  // Border colors (3:1+ contrast ratio)
  borderDefault: '#4B5563', // gray-600 (improved contrast: 7.56:1)
  borderHover: '#374151', // gray-700
  
  // Background colors
  backgroundPrimary: '#FFFFFF', // white
  backgroundSecondary: '#F9FAFB', // gray-50
  backgroundDisabled: '#F3F4F6', // gray-100
} as const;

/**
 * Validate all LoginForm colors against WCAG AA standards
 */
export function validateLoginFormColors(): { 
  isCompliant: boolean; 
  violations: string[];
  results: Array<{
    combination: string;
    ratio: number;
    level: 'FAIL' | 'AA' | 'AAA';
    required: number;
    passes: boolean;
  }>;
} {
  const violations: string[] = [];
  const results: Array<{
    combination: string;
    ratio: number;
    level: 'FAIL' | 'AA' | 'AAA';
    required: number;
    passes: boolean;
  }> = [];
  
  const combinations = [
    // Text combinations
    { name: 'Primary text on white', fg: WCAG_AA_COLORS.textPrimary, bg: WCAG_AA_COLORS.backgroundPrimary, large: false },
    { name: 'Secondary text on white', fg: WCAG_AA_COLORS.textSecondary, bg: WCAG_AA_COLORS.backgroundPrimary, large: false },
    { name: 'Error text on error background', fg: WCAG_AA_COLORS.errorText, bg: WCAG_AA_COLORS.errorBackground, large: false },
    { name: 'Success text on success background', fg: WCAG_AA_COLORS.successText, bg: WCAG_AA_COLORS.successBackground, large: false },
    
    // Button combinations
    { name: 'Button text on primary button', fg: WCAG_AA_COLORS.buttonPrimaryText, bg: WCAG_AA_COLORS.buttonPrimary, large: false },
    { name: 'Button text on hover button', fg: WCAG_AA_COLORS.buttonPrimaryText, bg: WCAG_AA_COLORS.buttonPrimaryHover, large: false },
    
    // Border combinations (3:1 minimum for non-text elements)
    { name: 'Default border on white', fg: WCAG_AA_COLORS.borderDefault, bg: WCAG_AA_COLORS.backgroundPrimary, large: true },
    { name: 'Focus ring visibility', fg: WCAG_AA_COLORS.focusRing, bg: WCAG_AA_COLORS.backgroundPrimary, large: true },
  ];
  
  combinations.forEach(combo => {
    const ratio = getContrastRatio(combo.fg, combo.bg);
    const level = getAccessibilityLevel(combo.fg, combo.bg, combo.large);
    const required = combo.large ? 3 : 4.5;
    const passes = ratio >= required;
    
    results.push({
      combination: combo.name,
      ratio: Math.round(ratio * 100) / 100,
      level,
      required,
      passes
    });
    
    if (!passes) {
      violations.push(`${combo.name}: ${ratio.toFixed(2)}:1 (requires ${required}:1)`);
    }
  });
  
  return {
    isCompliant: violations.length === 0,
    violations,
    results
  };
}

/**
 * Generate a CSS custom properties file with WCAG AA compliant colors
 */
export function generateAccessibleCSS(): string {
  const colors = WCAG_AA_COLORS;
  
  return `
/* WCAG AA Compliant Color System for LoginForm */
:root {
  /* Primary Text Colors (7:1+ contrast ratio) */
  --text-primary: ${colors.textPrimary};
  --text-secondary: ${colors.textSecondary};
  --text-muted: ${colors.textMuted};
  
  /* Error Colors (7:1+ contrast ratio) */
  --error-text: ${colors.errorText};
  --error-border: ${colors.errorBorder};
  --error-background: ${colors.errorBackground};
  
  /* Success Colors (7:1+ contrast ratio) */
  --success-text: ${colors.successText};
  --success-border: ${colors.successBorder};
  --success-background: ${colors.successBackground};
  
  /* Button Colors (4.5:1+ contrast ratio) */
  --button-primary: ${colors.buttonPrimary};
  --button-primary-hover: ${colors.buttonPrimaryHover};
  --button-primary-text: ${colors.buttonPrimaryText};
  
  /* Focus Colors (3:1+ contrast ratio) */
  --focus-ring: ${colors.focusRing};
  --focus-ring-offset: ${colors.focusRingOffset};
  
  /* Border Colors (3:1+ contrast ratio) */
  --border-default: ${colors.borderDefault};
  --border-hover: ${colors.borderHover};
  
  /* Background Colors */
  --background-primary: ${colors.backgroundPrimary};
  --background-secondary: ${colors.backgroundSecondary};
  --background-disabled: ${colors.backgroundDisabled};
}

/* High Contrast Mode Enhancements */
@media (prefers-contrast: high) {
  :root {
    --text-primary: #000000;
    --text-secondary: #000000;
    --border-default: #000000;
    --focus-ring: #000000;
  }
}

/* Reduced Motion Preferences */
@media (prefers-reduced-motion: reduce) {
  .transition-all,
  .transition-colors {
    transition-duration: 0.01ms !important;
  }
  
  .animate-spin {
    animation: none !important;
  }
}
`.trim();
}