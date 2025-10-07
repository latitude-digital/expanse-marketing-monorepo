/**
 * Shared formatting utilities for data display
 */

/**
 * Format phone number to US standard format
 * @param phone Raw phone number string
 * @returns Formatted phone number (XXX) XXX-XXXX or original if invalid
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  
  return phone;
}

/**
 * Format date to localized string
 * @param date Date object or string
 * @param locale Locale string (default 'en-US')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format time to localized string
 * @param date Date object or string
 * @param locale Locale string (default 'en-US')
 * @returns Formatted time string
 */
export function formatTime(date: Date | string, locale: string = 'en-US'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format date and time together
 */
export function formatDateTime(date: Date | string, locale: string = 'en-US'): string {
  return `${formatDate(date, locale)} at ${formatTime(date, locale)}`;
}

/**
 * Format name (capitalize first letter of each word)
 */
export function formatName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format zip code with optional +4
 */
export function formatZipCode(zip: string): string {
  const cleaned = zip.replace(/\D/g, '');
  
  if (cleaned.length === 5) {
    return cleaned;
  }
  
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  
  return zip;
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format age bracket for Ford/Lincoln APIs
 */
export function formatAgeBracket(age: number | string): string {
  const ageNum = typeof age === 'string' ? parseInt(age) : age;
  
  if (ageNum < 18) return 'Under 18';
  if (ageNum <= 24) return '18 - 24';
  if (ageNum <= 34) return '25 - 34';
  if (ageNum <= 44) return '35 - 44';
  if (ageNum <= 54) return '45 - 54';
  if (ageNum <= 64) return '55 - 64';
  return '65+';
}

/**
 * Format survey type for display
 */
export function formatSurveyType(surveyType: string): string {
  const typeMap: Record<string, string> = {
    'basic': 'Basic Survey',
    'post-td': 'Post Test Drive',
    'pre-td': 'Pre Test Drive',
    'experience': 'Experience Survey',
    'showtracker': 'Show Tracker',
    'mav': 'Most Appealing Vehicle'
  };
  
  return typeMap[surveyType.toLowerCase()] || surveyType;
}