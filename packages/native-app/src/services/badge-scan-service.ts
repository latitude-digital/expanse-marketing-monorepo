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
  console.log('[BadgeScan] Looking up barcode:', scanValue);
  const licenseCode =
    config.license_code ||
    config.licenseCode ||
    config.license ||
    config.apiKey;

  if (!licenseCode) {
    throw new Error('PlusLead configuration is missing a license_code');
  }

  const baseUrl = config.baseUrl || config.base_url || DEFAULT_PLUSLEAD_BASE_URL;
  // PlusLead API uses /sdk/capture endpoint with GET method
  const endpoint = config.endpoint || `${baseUrl.replace(/\/$/, '')}/sdk/capture`;

  // Build query string parameters
  const params = new URLSearchParams({
    license_code: licenseCode,
    barcode: scanValue,
    ...(config.queryParams || {}),
  });

  const url = `${endpoint}?${params.toString()}`;

  console.log('[BadgeScan] Calling PlusLead API:', url);

  const headers: Record<string, string> = {};

  if (config.api_key || config.apiKey) {
    headers['X-API-Key'] = config.api_key || config.apiKey;
  }

  const response = await createAbortableFetch(
    url,
    {
      method: 'GET',
      headers,
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
  let answers = flattenObject(json);

  // Apply dataMap if provided
  if (config.dataMap && typeof config.dataMap === 'object') {
    const mappedAnswers: Record<string, any> = {};
    const errors: string[] = [];

    for (const [apiKey, surveyKey] of Object.entries(config.dataMap)) {
      try {
        if (!apiKey || !surveyKey) {
          console.warn('[BadgeScan] Skipping invalid mapping entry:', { apiKey, surveyKey });
          continue;
        }

        if (answers[apiKey] === undefined) {
          console.warn('[BadgeScan] Field not found in API response:', apiKey);
          continue;
        }

        const value = answers[apiKey];

        // Handle nested keys like "address_group.address1"
        if (surveyKey.includes('.')) {
          const parts = surveyKey.split('.');
          let current = mappedAnswers;

          for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!current[part]) {
              current[part] = {};
            }
            // Ensure we're working with an object
            if (typeof current[part] !== 'object' || current[part] === null) {
              throw new Error(`Cannot set nested property on non-object at path: ${parts.slice(0, i + 1).join('.')}`);
            }
            current = current[part];
          }

          current[parts[parts.length - 1]] = value;
        } else {
          mappedAnswers[surveyKey as string] = value;
        }
      } catch (error) {
        const errorMsg = `Failed to map ${apiKey} -> ${surveyKey}: ${error instanceof Error ? error.message : String(error)}`;
        console.error('[BadgeScan]', errorMsg);
        errors.push(errorMsg);
        // Continue processing other mappings
      }
    }

    if (errors.length > 0) {
      console.warn('[BadgeScan] Mapping completed with errors:', errors);
    }

    console.log('[BadgeScan] Mapped answers:', JSON.stringify(mappedAnswers));
    answers = mappedAnswers;
  }

  // Add metadata fields for tracking
  answers._scanValue = scanValue;
  answers._scanResponse = json;

  console.log('[BadgeScan] Final answers with metadata:', JSON.stringify(answers));

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
