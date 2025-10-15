import { MeridianBadgeScanConfig } from '@meridian-event-tech/shared/types';

export interface BadgeScanLookupResult {
  answers: Record<string, any>;
  raw: any;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_PLUSLEAD_BASE_URL = 'https://pluslead.mcievents.com/api';

const createAbortableFetch = async (
  url: string,
  options: RequestInit,
  timeoutMs: number
) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
};

const flattenObject = (input: any, prefix = '', depth = 0, maxDepth = 2): Record<string, any> => {
  if (!input || typeof input !== 'object') {
    return {};
  }

  return Object.entries(input).reduce<Record<string, any>>((acc, [key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;

    if (
      value === null ||
      value === undefined ||
      typeof value === 'function'
    ) {
      return acc;
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      acc[nextKey] = value;
      return acc;
    }

    if (Array.isArray(value)) {
      // Flatten arrays of primitives only to avoid exploding the payload
      const primitiveValues = value.filter(
        (item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
      );
      if (primitiveValues.length > 0) {
        acc[nextKey] = primitiveValues.join(', ');
      }
      return acc;
    }

    if (depth < maxDepth) {
      Object.assign(acc, flattenObject(value, nextKey, depth + 1, maxDepth));
    }

    return acc;
  }, {});
};

const lookupPlusLead = async (
  scanValue: string,
  config: Record<string, any>,
  timeoutMs: number
): Promise<BadgeScanLookupResult> => {
  const licenseCode =
    config.license_code ||
    config.licenseCode ||
    config.license ||
    config.apiKey;

  if (!licenseCode) {
    throw new Error('PlusLead configuration is missing a license_code');
  }

  const baseUrl = config.baseUrl || config.base_url || DEFAULT_PLUSLEAD_BASE_URL;
  const endpoint = config.endpoint || `${baseUrl.replace(/\/$/, '')}/lookup`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.api_key || config.apiKey) {
    headers['X-API-Key'] = config.api_key || config.apiKey;
  }

  const payload = {
    license_code: licenseCode,
    badge_value: scanValue,
    ...(config.payloadOverrides || {}),
  };

  const response = await createAbortableFetch(
    endpoint,
    {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    },
    timeoutMs
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `PlusLead lookup failed (${response.status}): ${text || response.statusText}`
    );
  }

  const json = await response.json().catch(() => ({}));
  const answers = flattenObject(json);

  return {
    answers,
    raw: json,
  };
};

export const badgeScanService = {
  async lookupBadge(
    badgeScan: MeridianBadgeScanConfig,
    scanValue: string,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<BadgeScanLookupResult> {
    if (!badgeScan?.vendor) {
      throw new Error('Badge scan vendor is not defined in custom configuration');
    }

    const vendor = badgeScan.vendor.toLowerCase();

    switch (vendor) {
      case 'pluslead':
        return lookupPlusLead(scanValue, badgeScan.config || {}, timeoutMs);
      default:
        throw new Error(`Unsupported badge scan vendor "${badgeScan.vendor}"`);
    }
  },
};
