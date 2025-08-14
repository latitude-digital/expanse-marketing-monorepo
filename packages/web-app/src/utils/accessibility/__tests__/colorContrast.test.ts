import { 
  getContrastRatio, 
  meetsWCAGAA, 
  meetsWCAGAAA, 
  getAccessibilityLevel,
  validateLoginFormColors,
  WCAG_AA_COLORS 
} from '../colorContrast';

describe('WCAG Color Contrast Utilities', () => {
  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratio for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 1); // Perfect contrast
    });

    it('should calculate correct contrast ratio for white on black', () => {
      const ratio = getContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 1); // Same as black on white
    });

    it('should handle identical colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 1); // No contrast
    });

    it('should throw error for invalid color format', () => {
      expect(() => getContrastRatio('invalid', '#ffffff')).toThrow('Invalid color format');
    });
  });

  describe('WCAG AA Compliance', () => {
    it('should pass AA for high contrast combinations', () => {
      // Black text on white background (21:1 ratio)
      expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
      expect(meetsWCAGAA('#000000', '#ffffff', true)).toBe(true);
      
      // Dark gray on white (12.6:1 ratio)
      expect(meetsWCAGAA('#374151', '#ffffff')).toBe(true);
    });

    it('should fail AA for low contrast combinations', () => {
      // Light gray on white (2.3:1 ratio - fails AA)
      expect(meetsWCAGAA('#d1d5db', '#ffffff')).toBe(false);
      
      // Medium gray on white (3.9:1 ratio - fails AA normal, passes AA large)
      expect(meetsWCAGAA('#9ca3af', '#ffffff', false)).toBe(false);
      expect(meetsWCAGAA('#9ca3af', '#ffffff', true)).toBe(true);
    });
  });

  describe('WCAG AAA Compliance', () => {
    it('should pass AAA for very high contrast', () => {
      expect(meetsWCAGAAA('#000000', '#ffffff')).toBe(true);
      expect(meetsWCAGAAA('#000000', '#ffffff', true)).toBe(true);
    });

    it('should fail AAA for moderate contrast', () => {
      // 5:1 ratio passes AA but fails AAA for normal text
      expect(meetsWCAGAAA('#6b7280', '#ffffff', false)).toBe(false);
      // But passes AAA for large text
      expect(meetsWCAGAAA('#6b7280', '#ffffff', true)).toBe(true);
    });
  });

  describe('getAccessibilityLevel', () => {
    it('should return correct accessibility levels', () => {
      expect(getAccessibilityLevel('#000000', '#ffffff')).toBe('AAA');
      expect(getAccessibilityLevel('#374151', '#ffffff')).toBe('AAA');
      expect(getAccessibilityLevel('#6b7280', '#ffffff')).toBe('AA');
      expect(getAccessibilityLevel('#6b7280', '#ffffff', true)).toBe('AAA');
      expect(getAccessibilityLevel('#d1d5db', '#ffffff')).toBe('FAIL');
    });
  });

  describe('LoginForm Color Validation', () => {
    it('should validate all LoginForm colors meet WCAG AA standards', () => {
      const validation = validateLoginFormColors();
      
      expect(validation.isCompliant).toBe(true);
      expect(validation.violations).toHaveLength(0);
      
      // All results should pass their required ratios
      validation.results.forEach(result => {
        expect(result.passes).toBe(true);
        expect(result.ratio).toBeGreaterThanOrEqual(result.required);
      });
    });

    it('should have comprehensive color coverage', () => {
      const validation = validateLoginFormColors();
      
      // Should test key color combinations
      const combinations = validation.results.map(r => r.combination);
      expect(combinations).toContain('Primary text on white');
      expect(combinations).toContain('Error text on error background');
      expect(combinations).toContain('Button text on primary button');
      expect(combinations).toContain('Focus ring visibility');
    });

    it('should provide detailed contrast information', () => {
      const validation = validateLoginFormColors();
      
      validation.results.forEach(result => {
        expect(result).toHaveProperty('combination');
        expect(result).toHaveProperty('ratio');
        expect(result).toHaveProperty('level');
        expect(result).toHaveProperty('required');
        expect(result).toHaveProperty('passes');
        
        expect(result.ratio).toBeGreaterThan(0);
        expect(['FAIL', 'AA', 'AAA']).toContain(result.level);
        expect([3, 4.5]).toContain(result.required);
      });
    });
  });

  describe('WCAG_AA_COLORS constants', () => {
    it('should have all required color categories', () => {
      expect(WCAG_AA_COLORS).toHaveProperty('textPrimary');
      expect(WCAG_AA_COLORS).toHaveProperty('textSecondary');
      expect(WCAG_AA_COLORS).toHaveProperty('errorText');
      expect(WCAG_AA_COLORS).toHaveProperty('successText');
      expect(WCAG_AA_COLORS).toHaveProperty('buttonPrimary');
      expect(WCAG_AA_COLORS).toHaveProperty('focusRing');
      expect(WCAG_AA_COLORS).toHaveProperty('borderDefault');
      expect(WCAG_AA_COLORS).toHaveProperty('backgroundPrimary');
    });

    it('should use valid hex color format', () => {
      Object.values(WCAG_AA_COLORS).forEach(color => {
        expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    it('should meet minimum contrast requirements', () => {
      const { textPrimary, textSecondary, backgroundPrimary } = WCAG_AA_COLORS;
      
      // Primary text should exceed AA requirements
      expect(meetsWCAGAA(textPrimary, backgroundPrimary)).toBe(true);
      expect(meetsWCAGAA(textSecondary, backgroundPrimary)).toBe(true);
      
      // Should preferably meet AAA
      expect(meetsWCAGAAA(textPrimary, backgroundPrimary)).toBe(true);
    });
  });

  describe('Error and Success Color Validation', () => {
    it('should have sufficient contrast for error states', () => {
      const { errorText, errorBackground, errorBorder, backgroundPrimary } = WCAG_AA_COLORS;
      
      // Error text on error background
      expect(meetsWCAGAA(errorText, errorBackground)).toBe(true);
      
      // Error border should be visible
      expect(getContrastRatio(errorBorder, backgroundPrimary)).toBeGreaterThanOrEqual(3);
    });

    it('should have sufficient contrast for success states', () => {
      const { successText, successBackground, successBorder, backgroundPrimary } = WCAG_AA_COLORS;
      
      // Success text on success background  
      expect(meetsWCAGAA(successText, successBackground)).toBe(true);
      
      // Success border should be visible
      expect(getContrastRatio(successBorder, backgroundPrimary)).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Interactive Element Validation', () => {
    it('should have sufficient contrast for buttons', () => {
      const { buttonPrimaryText, buttonPrimary, buttonPrimaryHover } = WCAG_AA_COLORS;
      
      // Button text on button background
      expect(meetsWCAGAA(buttonPrimaryText, buttonPrimary)).toBe(true);
      expect(meetsWCAGAA(buttonPrimaryText, buttonPrimaryHover)).toBe(true);
    });

    it('should have visible focus indicators', () => {
      const { focusRing, backgroundPrimary } = WCAG_AA_COLORS;
      
      // Focus ring should be visible against background
      expect(getContrastRatio(focusRing, backgroundPrimary)).toBeGreaterThanOrEqual(3);
    });

    it('should have visible borders', () => {
      const { borderDefault, borderHover, backgroundPrimary } = WCAG_AA_COLORS;
      
      // Borders should meet 3:1 minimum for non-text elements
      expect(getContrastRatio(borderDefault, backgroundPrimary)).toBeGreaterThanOrEqual(3);
      expect(getContrastRatio(borderHover, backgroundPrimary)).toBeGreaterThanOrEqual(3);
    });
  });
});