const ASSET_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'webp',
  'bmp',
  'ico',
  'avif',
  'mp4',
  'm4v',
  'webm',
  'mov',
  'mp3',
  'm4a',
  'wav',
  'ogg',
  'csv',
  'json',
  'txt',
  'css',
  'js',
  'woff',
  'woff2',
  'ttf',
  'otf',
  'eot',
  'zip',
  'pdf',
]);

const URL_REGEX = /https?:\/\/[^\s"'()<>\\]+/gi;

function hasAllowedExtension(url: string): boolean {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname || '';
    const match = pathname.match(/\.([a-z0-9]+)$/i);
    if (!match) {
      return false;
    }
    return ASSET_EXTENSIONS.has(match[1].toLowerCase());
  } catch (error) {
    return false;
  }
}

function sanitizeMatch(match: string): string {
  // Remove trailing punctuation that commonly appears after URLs
  return match.replace(/[),.;]+$/, '');
}

export function isLikelyAssetUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!/^https?:\/\//i.test(url)) return false;
  return hasAllowedExtension(url);
}

export function extractAssetUrlsFromString(source: string): string[] {
  if (!source || typeof source !== 'string') {
    return [];
  }

  const matches = source.match(URL_REGEX);
  if (!matches) {
    return [];
  }

  const results = new Set<string>();
  for (const rawMatch of matches) {
    const cleaned = sanitizeMatch(rawMatch);
    if (isLikelyAssetUrl(cleaned)) {
      results.add(cleaned);
    }
  }

  return Array.from(results);
}

export function extractAssetUrlsFromValue(value: unknown): string[] {
  if (typeof value === 'string') {
    return extractAssetUrlsFromString(value);
  }

  if (Array.isArray(value)) {
    const results = new Set<string>();
    for (const item of value) {
      extractAssetUrlsFromValue(item).forEach((url) => results.add(url));
    }
    return Array.from(results);
  }

  if (value && typeof value === 'object') {
    if (value instanceof Date) {
      return [];
    }

    const results = new Set<string>();
    for (const item of Object.values(value)) {
      extractAssetUrlsFromValue(item).forEach((url) => results.add(url));
    }
    return Array.from(results);
  }

  return [];
}

export function replaceAssetUrlsInValue(value: any, assetMap: Record<string, string>): any {
  if (!value) {
    return value;
  }

  if (typeof value === 'string') {
    let result = value;
    for (const [remote, local] of Object.entries(assetMap)) {
      if (remote && local && result.includes(remote)) {
        result = result.split(remote).join(local);
      }
    }
    return result;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceAssetUrlsInValue(item, assetMap));
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const next: Record<string, unknown> = {};
    let changed = false;

    for (const [key, val] of entries) {
      const updated = replaceAssetUrlsInValue(val, assetMap);
      next[key] = updated;
      if (updated !== val) {
        changed = true;
      }
    }

    return changed ? next : value;
  }

  return value;
}
