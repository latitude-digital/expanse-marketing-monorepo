/**
 * Survey Bundle Manager
 *
 * Manages writing the survey HTML bundle to the filesystem and loading it from file:// URL.
 * The .htmlx file is included in the Metro JS bundle as an asset (enabling OTA updates)
 * and written to the filesystem as .html on app launch.
 */

import { Paths, File, Directory } from 'expo-file-system/next';
import { Asset } from 'expo-asset';
import * as Crypto from 'expo-crypto';
import { AssetCacheService } from '../services/asset-cache';

const UTF8_ENCODING = 'utf8' as const;

const SURVEY_DIR_NAME = 'survey';
const SURVEY_FILE_NAME = 'index.html';
const HASH_FILE_NAME = '.hash';

// Import the survey bundle as a Metro asset
const SURVEY_ASSET = require('../../assets/survey/index.htmlx');

/**
 * Ensures the survey HTML is written to the filesystem
 * Returns the file:// URL to load in WebView
 */
export async function ensureSurveyBundle(): Promise<string> {
  try {
    console.log('[SurveyBundleManager] Loading survey bundle from Metro asset...');

    // Load the asset from Metro bundle
    const asset = Asset.fromModule(SURVEY_ASSET);
    await asset.downloadAsync();

    console.log('[SurveyBundleManager] Asset loaded from:', asset.localUri);

    // Read the .htmlx content as text
    const htmlxFile = new File(asset.localUri!);
    const surveyHTML = await htmlxFile.text();
    const htmlSizeKB = (surveyHTML.length / 1024).toFixed(2);

    console.log('[SurveyBundleManager] Survey HTML size:', htmlSizeKB, 'KB');

    // Calculate MD5 hash of the content
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      surveyHTML
    );
    console.log('[SurveyBundleManager] Survey HTML MD5:', hash);

    // Get references to directory and files for cached version
    const surveyDir = new Directory(Paths.document, SURVEY_DIR_NAME);
    const surveyFile = new File(surveyDir, SURVEY_FILE_NAME);
    const hashFile = new File(surveyDir, HASH_FILE_NAME);

    // Ensure survey directory exists (check first because create() is not idempotent)
    if (!(await surveyDir.exists)) {
      await surveyDir.create({ intermediates: true });
    }

    let needsWrite = true;

    // Try to read existing hash file to check if bundle needs updating
    try {
      const storedHash = await hashFile.text();
      console.log('[SurveyBundleManager] Stored MD5:', storedHash);

      if (storedHash === hash) {
        console.log('[SurveyBundleManager] Hash matches, using cached bundle');
        needsWrite = false;
      } else {
        console.log('[SurveyBundleManager] Hash mismatch, bundle updated via OTA');
      }
    } catch (error) {
      // Hash file doesn't exist or can't be read - need to write bundle
      console.log('[SurveyBundleManager] No valid hash file found, will write bundle');
    }

    // Write HTML and hash if needed
    let htmlForWrite = surveyHTML;
    try {
      const assetCache = await AssetCacheService.getInstance();
      const { html: htmlWithCachedAssets } = await assetCache.prefetchAssetsFromHtml(surveyHTML);
      htmlForWrite = htmlWithCachedAssets;
    } catch (error) {
      console.warn('[SurveyBundleManager] Failed to prefetch survey assets:', error);
    }

    let shouldWrite = needsWrite;

    if (!shouldWrite) {
      try {
        const existingContent = await surveyFile.text();
        shouldWrite = existingContent !== htmlForWrite;
      } catch (error) {
        shouldWrite = true;
      }
    }

    if (shouldWrite) {
      console.log('[SurveyBundleManager] Writing survey HTML to filesystem as .html...');

      await surveyFile.write(htmlForWrite, { encoding: UTF8_ENCODING });
      await hashFile.write(hash, { encoding: UTF8_ENCODING });

      console.log('[SurveyBundleManager] ✅ Survey bundle written to filesystem');
    }

    // Return file:// URL
    const fileUrl = surveyFile.uri;
    console.log('[SurveyBundleManager] Bundle ready at:', fileUrl);
    return fileUrl;

  } catch (error) {
    console.error('[SurveyBundleManager] Error ensuring survey bundle:', error);
    throw error;
  }
}

/**
 * Clears the cached survey bundle (for testing purposes)
 */
export async function clearSurveyBundle(): Promise<void> {
  try {
    const surveyDir = new Directory(Paths.document, SURVEY_DIR_NAME);
    await surveyDir.delete();
    console.log('[SurveyBundleManager] Survey bundle cleared');
  } catch (error) {
    console.error('[SurveyBundleManager] Error clearing survey bundle:', error);
  }
}
