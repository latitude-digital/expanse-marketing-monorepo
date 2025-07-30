/**
 * Brand detection and utility functions for FDS conditional loading
 */

/**
 * Determines if Ford Design System should be loaded for the given brand
 * @param brand - The event brand ('Ford', 'Lincoln', 'Other', or undefined)
 * @returns true if FDS should be loaded (Ford/Lincoln), false otherwise
 */
export function shouldLoadFDS(brand?: string): boolean {
  return brand === 'Ford' || brand === 'Lincoln';
}

/**
 * Gets the appropriate theme class name for the given brand
 * @param brand - The event brand ('Ford', 'Lincoln', 'Other', or undefined)
 * @returns CSS theme class name for the brand
 */
export function getBrandTheme(brand?: string): string {
  switch (brand) {
    case 'Ford':
      return 'ford_light';
    case 'Lincoln':
      return 'lincoln_light';
    default:
      return 'unbranded';
  }
}

/**
 * Gets a normalized brand value, treating undefined/null as 'Other'
 * @param brand - The event brand
 * @returns Normalized brand string
 */
export function normalizeBrand(brand?: string | null): 'Ford' | 'Lincoln' | 'Other' {
  if (brand === 'Ford' || brand === 'Lincoln') {
    return brand;
  }
  return 'Other';
}