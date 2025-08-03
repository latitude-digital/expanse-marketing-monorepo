import type { Brand } from '@expanse/shared/types';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textOnPrimary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface Theme {
  name: string;
  brand: Brand;
  colors: ThemeColors;
  fonts: {
    regular: string;
    medium: string;
    bold: string;
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  shadows: {
    sm: object;
    md: object;
    lg: object;
  };
}

const baseTheme = {
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 24,
      xxl: 32,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

const fordTheme: Theme = {
  name: 'Ford',
  brand: 'Ford',
  colors: {
    primary: '#0066CC',
    primaryDark: '#004D99',
    primaryLight: '#3385FF',
    secondary: '#F7F8FA',
    secondaryLight: '#FFFFFF',
    accent: '#FF6B35',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textOnPrimary: '#FFFFFF',
    border: '#DEE2E6',
    error: '#DC3545',
    warning: '#FFC107',
    success: '#28A745',
    info: '#17A2B8',
  },
  ...baseTheme,
};

const lincolnTheme: Theme = {
  name: 'Lincoln',
  brand: 'Lincoln',
  colors: {
    primary: '#8B1538',
    primaryDark: '#6B1028',
    primaryLight: '#A5234A',
    secondary: '#F5F0F2',
    secondaryLight: '#FFFFFF',
    accent: '#B8860B',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textOnPrimary: '#FFFFFF',
    border: '#DEE2E6',
    error: '#DC3545',
    warning: '#FFC107',
    success: '#28A745',
    info: '#17A2B8',
  },
  ...baseTheme,
};

const otherTheme: Theme = {
  name: 'Other',
  brand: 'Other',
  colors: {
    primary: '#333333',
    primaryDark: '#1A1A1A',
    primaryLight: '#666666',
    secondary: '#F8F9FA',
    secondaryLight: '#FFFFFF',
    accent: '#007BFF',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textOnPrimary: '#FFFFFF',
    border: '#DEE2E6',
    error: '#DC3545',
    warning: '#FFC107',
    success: '#28A745',
    info: '#17A2B8',
  },
  ...baseTheme,
};

export class ThemeProvider {
  private static instance: ThemeProvider;
  private currentTheme: Theme = otherTheme;
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor() {
    if (ThemeProvider.instance) {
      return ThemeProvider.instance;
    }
    ThemeProvider.instance = this;
  }

  /**
   * Get current active theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Set theme by brand
   */
  setTheme(brand: Brand): void {
    const newTheme = this.getThemeByBrand(brand);
    
    if (newTheme.name !== this.currentTheme.name) {
      this.currentTheme = newTheme;
      this.notifyListeners();
    }
  }

  /**
   * Get theme by brand
   */
  getThemeByBrand(brand: Brand): Theme {
    switch (brand) {
      case 'Ford':
        return fordTheme;
      case 'Lincoln':
        return lincolnTheme;
      case 'Other':
      default:
        return otherTheme;
    }
  }

  /**
   * Get available themes
   */
  getAvailableThemes(): Theme[] {
    return [fordTheme, lincolnTheme, otherTheme];
  }

  /**
   * Get brand-specific colors
   */
  getBrandColors(brand: Brand): ThemeColors {
    return this.getThemeByBrand(brand).colors;
  }

  /**
   * Get brand primary color
   */
  getBrandPrimaryColor(brand: Brand): string {
    return this.getBrandColors(brand).primary;
  }

  /**
   * Get brand secondary color
   */
  getBrandSecondaryColor(brand: Brand): string {
    return this.getBrandColors(brand).secondary;
  }

  /**
   * Subscribe to theme changes
   */
  addListener(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove a specific listener
   */
  removeListener(listener: (theme: Theme) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.currentTheme);
      } catch (error) {
        console.error('Error in theme listener:', error);
      }
    });
  }

  /**
   * Create brand-aware styles helper
   */
  createBrandStyles<T extends Record<string, any>>(
    styleFactory: (theme: Theme) => T
  ): T {
    return styleFactory(this.currentTheme);
  }

  /**
   * Get brand-specific WebView CSS injection
   */
  getBrandCSSClass(brand: Brand): string {
    switch (brand) {
      case 'Ford':
        return 'ford_light'; // Matches web-app Ford Design System
      case 'Lincoln':
        return 'lincoln_light'; // Matches web-app Ford Design System
      case 'Other':
      default:
        return 'unbranded';
    }
  }

  /**
   * Get brand-specific font families for WebView
   */
  getBrandFontFamily(brand: Brand): string {
    switch (brand) {
      case 'Ford':
        return 'FordF1, Arial, sans-serif';
      case 'Lincoln':
        return 'LincolnFont, Georgia, serif';
      case 'Other':
      default:
        return 'system-ui, Arial, sans-serif';
    }
  }

  /**
   * Generate brand-aware component styles
   */
  getComponentStyles(brand: Brand) {
    const colors = this.getBrandColors(brand);
    
    return {
      button: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
      },
      buttonText: {
        color: colors.textOnPrimary,
      },
      card: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderLeftColor: colors.primary,
      },
      cardHeader: {
        backgroundColor: colors.secondary,
      },
      text: {
        color: colors.text,
      },
      textSecondary: {
        color: colors.textSecondary,
      },
      link: {
        color: colors.primary,
      },
      badge: {
        backgroundColor: colors.accent,
      },
      input: {
        borderColor: colors.border,
        backgroundColor: colors.surface,
      },
      inputFocused: {
        borderColor: colors.primary,
      },
    };
  }
}

// Export singleton instance
export const themeProvider = new ThemeProvider();

// Export individual themes
export { fordTheme, lincolnTheme, otherTheme };