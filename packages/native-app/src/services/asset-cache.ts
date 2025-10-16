import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { offlineDetector } from '../utils/offline-detector';
import {
  extractAssetUrlsFromString,
  extractAssetUrlsFromValue,
} from '../utils/asset-urls';
import type { MeridianEvent as ExpanseEvent } from '@meridian-event-tech/shared/types';

interface AssetMetadata {
  url: string;
  hash: string;
  fileUri: string;
  contentType?: string | null;
  contentLength?: number;
  etag?: string | null;
  lastModified?: number | null;
  maxAgeMs?: number | null;
  immutable?: boolean;
  lastFetched: number;
}

interface AssetManifest {
  version: number;
  assets: Record<string, AssetMetadata>;
}

const ensureTrailingSlash = (value?: string | null): string => {
  if (!value) {
    return '';
  }
  if (!value.endsWith('/')) {
    return `${value}/`;
  }
  return value;
};

const getBaseDocumentDirectory = (): string => {
  const fs = FileSystem as any;
  const docDir = ensureTrailingSlash(fs?.documentDirectory as string | undefined);
  const cacheDir = ensureTrailingSlash(fs?.cacheDirectory as string | undefined);
  const base = docDir || cacheDir;
  if (!base) {
    throw new Error('FileSystem directories unavailable');
  }
  return base;
};

const CACHE_DIRECTORY = `${getBaseDocumentDirectory()}asset-cache`;
const BASE64_ENCODING = 'base64' as const;
const MANIFEST_PATH = `${CACHE_DIRECTORY}/manifest.json`;
const MANIFEST_VERSION = 1;

const FALLBACK_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export class AssetCacheService {
  private static instance: AssetCacheService | null = null;
  private manifest: AssetManifest = { version: MANIFEST_VERSION, assets: {} };
  private manifestLoaded = false;
  private savePromise: Promise<void> | null = null;
  private inFlightDownloads = new Map<string, Promise<AssetMetadata>>();
  private readonly base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  static async getInstance(): Promise<AssetCacheService> {
    if (!AssetCacheService.instance) {
      const service = new AssetCacheService();
      await service.initialize();
      AssetCacheService.instance = service;
    }
    return AssetCacheService.instance;
  }

  private async initialize(): Promise<void> {
    await this.ensureCacheDirectory();
    await this.loadManifest();
  }

  private async ensureCacheDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIRECTORY, { intermediates: true });
    }
  }

  private async loadManifest(): Promise<void> {
    if (this.manifestLoaded) {
      return;
    }

    const info = await FileSystem.getInfoAsync(MANIFEST_PATH);
    if (!info.exists) {
      await FileSystem.writeAsStringAsync(MANIFEST_PATH, JSON.stringify(this.manifest));
      this.manifestLoaded = true;
      return;
    }

    try {
    const content = await FileSystem.readAsStringAsync(MANIFEST_PATH);
      const parsed = JSON.parse(content) as AssetManifest;
      if (parsed.version === MANIFEST_VERSION && parsed.assets) {
        this.manifest = parsed;
      }
    } catch (error) {
      console.warn('[AssetCache] Failed to read manifest, starting fresh:', error);
      this.manifest = { version: MANIFEST_VERSION, assets: {} };
    }

    this.manifestLoaded = true;
  }

  private async saveManifest(): Promise<void> {
    if (this.savePromise) {
      return this.savePromise;
    }

    this.savePromise = FileSystem.writeAsStringAsync(
      MANIFEST_PATH,
      JSON.stringify(this.manifest)
    ).finally(() => {
      this.savePromise = null;
    });

    return this.savePromise;
  }

  private async hashUrl(url: string): Promise<string> {
    return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, url);
  }

  private async fileExists(uri: string): Promise<boolean> {
    if (!uri) return false;
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists;
  }

  private parseCacheControl(header: string | null): { maxAgeMs?: number; immutable?: boolean } {
    if (!header) {
      return {};
    }

    const directives = header
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);

    const result: { maxAgeMs?: number; immutable?: boolean } = {};

    for (const directive of directives) {
      if (directive.startsWith('max-age=')) {
        const value = Number(directive.replace('max-age=', ''));
        if (!Number.isNaN(value)) {
          result.maxAgeMs = value * 1000;
        }
      } else if (directive === 'immutable') {
        result.immutable = true;
      } else if (directive === 'no-cache' || directive === 'no-store') {
        result.maxAgeMs = 0;
      }
    }

    return result;
  }

  private deriveExtension(url: string, contentType?: string | null, existingUri?: string): string {
    if (existingUri) {
      const existingMatch = existingUri.match(/\.([a-z0-9]+)$/i);
      if (existingMatch) {
        return existingMatch[1];
      }
    }

    const urlMatch = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
    if (urlMatch) {
      return urlMatch[1];
    }

    if (contentType) {
      const mapping: Record<string, string> = {
        'image/png': 'png',
        'image/jpeg': 'jpg',
        'image/gif': 'gif',
        'image/svg+xml': 'svg',
        'image/webp': 'webp',
        'image/bmp': 'bmp',
        'image/x-icon': 'ico',
        'font/woff': 'woff',
        'font/woff2': 'woff2',
        'font/ttf': 'ttf',
        'font/otf': 'otf',
        'text/css': 'css',
        'text/javascript': 'js',
        'application/javascript': 'js',
        'application/json': 'json',
        'text/plain': 'txt',
        'audio/mpeg': 'mp3',
        'audio/mp4': 'm4a',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'video/mp4': 'mp4',
        'video/quicktime': 'mov',
        'video/webm': 'webm',
        'application/zip': 'zip',
        'application/pdf': 'pdf',
      };

      if (mapping[contentType]) {
        return mapping[contentType];
      }
    }

    return 'bin';
  }

  private isMetadataFresh(metadata: AssetMetadata): boolean {
    if (!metadata) {
      return false;
    }

    if (metadata.immutable) {
      return true;
    }

    const ttl = metadata.maxAgeMs ?? FALLBACK_TTL_MS;
    if (!ttl || ttl <= 0) {
      return false;
    }

    return Date.now() - metadata.lastFetched < ttl;
  }

  private async downloadAsset(url: string, force = false): Promise<AssetMetadata> {
    await this.ensureCacheDirectory();
    await this.loadManifest();

    const hash = await this.hashUrl(url);
    if (this.inFlightDownloads.has(hash)) {
      return this.inFlightDownloads.get(hash)!;
    }

    const existing = this.manifest.assets[hash];
    const promise = this.fetchAndStoreAsset(url, hash, existing, force).finally(() => {
      this.inFlightDownloads.delete(hash);
    });

    this.inFlightDownloads.set(hash, promise);
    return promise;
  }

  private async fetchAndStoreAsset(
    url: string,
    hash: string,
    existing: AssetMetadata | undefined,
    force = false
  ): Promise<AssetMetadata> {
    const headers: Record<string, string> = {};

    if (existing && !force) {
      if (existing.etag) {
        headers['If-None-Match'] = existing.etag;
      }

      if (existing.lastModified) {
        headers['If-Modified-Since'] = new Date(existing.lastModified).toUTCString();
      }

      if (this.isMetadataFresh(existing) && (await this.fileExists(existing.fileUri))) {
        return existing;
      }
    }

    try {
      const response = await fetch(url, { headers });

      if (response.status === 304 && existing && (await this.fileExists(existing.fileUri))) {
        const refreshed: AssetMetadata = {
          ...existing,
          lastFetched: Date.now(),
        };
        this.manifest.assets[hash] = refreshed;
        await this.saveManifest();
        return refreshed;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const base64 = this.arrayBufferToBase64(arrayBuffer);

      const contentType = response.headers.get('content-type');
      const contentLengthHeader = response.headers.get('content-length');
      const contentLength = contentLengthHeader ? Number(contentLengthHeader) : undefined;
      const etag = response.headers.get('etag');
      const lastModifiedHeader = response.headers.get('last-modified');
      const lastModified = lastModifiedHeader ? Date.parse(lastModifiedHeader) : undefined;
      const cacheControl = this.parseCacheControl(response.headers.get('cache-control'));

      const extension = this.deriveExtension(url, contentType, existing?.fileUri);
      const fileUri = `${CACHE_DIRECTORY}/${hash}.${extension}`;

      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: BASE64_ENCODING,
      });

      const metadata: AssetMetadata = {
        url,
        hash,
        fileUri,
        contentType,
        contentLength: Number.isFinite(contentLength) ? contentLength : undefined,
        etag,
        lastModified: lastModified && !Number.isNaN(lastModified) ? lastModified : undefined,
        maxAgeMs: cacheControl.maxAgeMs ?? null,
        immutable: cacheControl.immutable,
        lastFetched: Date.now(),
      };

      this.manifest.assets[hash] = metadata;
      await this.saveManifest();

      return metadata;
    } catch (error) {
      if (existing && (await this.fileExists(existing.fileUri))) {
        console.warn('[AssetCache] Network fetch failed, using existing cache:', url, error);
        return existing;
      }

      throw error;
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const len = bytes.length;
    if (len === 0) {
      return '';
    }

    let base64 = '';

    for (let i = 0; i < len; i += 3) {
      const byte1 = bytes[i];
      const byte2 = i + 1 < len ? bytes[i + 1] : 0;
      const byte3 = i + 2 < len ? bytes[i + 2] : 0;

      const enc1 = byte1 >> 2;
      const enc2 = ((byte1 & 0x03) << 4) | (byte2 >> 4);
      const enc3 = ((byte2 & 0x0f) << 2) | (byte3 >> 6);
      const enc4 = byte3 & 0x3f;

      base64 += this.base64Chars.charAt(enc1);
      base64 += this.base64Chars.charAt(enc2);
      base64 += i + 1 < len ? this.base64Chars.charAt(enc3) : '=';
      base64 += i + 2 < len ? this.base64Chars.charAt(enc4) : '=';
    }

    return base64;
  }

  async resolveAsset(url: string, force = false): Promise<string | null> {
    if (!url) {
      return null;
    }

    await this.loadManifest();
    const hash = await this.hashUrl(url);
    const existing = this.manifest.assets[hash];
    if (existing && (await this.fileExists(existing.fileUri)) && !force) {
      if (this.isMetadataFresh(existing)) {
        return existing.fileUri;
      }
    }

    if (!offlineDetector.isOnline() && existing && (await this.fileExists(existing.fileUri))) {
      return existing.fileUri;
    }

    if (!offlineDetector.isOnline() && !existing) {
      return null;
    }

    try {
      const metadata = await this.downloadAsset(url, force);
      return metadata.fileUri;
    } catch (error) {
      console.warn('[AssetCache] Failed to resolve asset:', url, error);
      return existing && (await this.fileExists(existing.fileUri)) ? existing.fileUri : null;
    }
  }

  async prefetchAssets(urls: string[], force = false): Promise<Record<string, string>> {
    const uniqueUrls = Array.from(new Set(urls));
    const assetMap: Record<string, string> = {};

    for (const url of uniqueUrls) {
      const localUri = await this.resolveAsset(url, force);
      if (localUri) {
        assetMap[url] = localUri;
      }
    }

    return assetMap;
  }

  async prefetchAssetsFromHtml(html: string, force = false): Promise<{
    html: string;
    assetMap: Record<string, string>;
  }> {
    const urls = extractAssetUrlsFromString(html);
    if (urls.length === 0) {
      return { html, assetMap: {} };
    }

    const assetMap = await this.prefetchAssets(urls, force);
    let rewritten = html;

    for (const [remote, local] of Object.entries(assetMap)) {
      rewritten = rewritten.split(remote).join(local);
    }

    return { html: rewritten, assetMap };
  }

  async prefetchAssetsForEvent(
    event: ExpanseEvent,
    force = false
  ): Promise<Record<string, string>> {
    const sources = [
      event.questions,
      event.surveyJSON,
      event.surveyJSModel,
      event.theme,
      event.surveyJSTheme,
      event.customConfig,
    ];

    const urls = new Set<string>();
    for (const source of sources) {
      extractAssetUrlsFromValue(source).forEach((url) => urls.add(url));
    }

    if (urls.size === 0) {
      return {};
    }

    return this.prefetchAssets(Array.from(urls), force);
  }

  async getCachedAssetUri(url: string): Promise<string | null> {
    await this.loadManifest();
    const hash = await this.hashUrl(url);
    const metadata = this.manifest.assets[hash];
    if (!metadata) {
      return null;
    }
    return (await this.fileExists(metadata.fileUri)) ? metadata.fileUri : null;
  }
}
