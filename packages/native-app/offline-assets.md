# Offline Assets Implementation Overview

This document captures the current state of Meridian’s offline asset work (web survey SPA packaged in the Expo native app), so it can be picked up on another machine without re-discovery.

## High-Level Goals

- Keep the single-file survey bundle (`packages/native-app/assets/survey/index.htmlx`) functional in the iOS WebView when offline.
- Cache all external assets (fonts, images, CSS, JS, etc.) that the SPA references, keyed by hashed URLs.
- Ensure cached assets are reused offline, refreshed when online, and never deleted preemptively when the device cannot reach the network.
- Allow users to manually refresh events (and their related assets) from the native event list screen, without wiping the cache first.

## Key Code Changes

### Asset Discovery and Rewriting (`packages/native-app/src/utils/asset-urls.ts`)
- Utility for discovering asset URLs within arbitrary strings/objects.
- Rewrites asset URLs to point at locally cached `file://` locations when the cache has fetched them.

### Asset Cache Service (`packages/native-app/src/services/asset-cache.ts`)
- SHA-256 keyed metadata (stored in `documentDirectory/asset-cache/manifest.json`); stores local file URIs, ETags, Cache-Control hints, etc.
- Downloads assets via `fetch`, supports conditional requests (If-None-Match/If-Modified-Since), respects TTL when online, falls back to cached copies when offline/out-of-date.
- Provides APIs:
  - `prefetchAssetsFromHtml(html)` → rewrites bundled survey HTML.
  - `prefetchAssetsForEvent(event)` → resolves URLs referenced inside event structure.
  - `resolveAsset(url)` → returns `file://` for WebView rewriting.

### Survey Bundle Manager (`packages/native-app/src/utils/surveyBundleManager.ts`)
- After Expo loads the inlined HTMLx bundle, rewrites external URLs to `file://` versions using the cache before writing to `documentDirectory/survey/index.html`.
- Only writes when content changed (hash mismatch or updated rewrites) to avoid unnecessary I/O.

### Event Caching Enhancements (`packages/native-app/src/services/event-cache.ts`)
- Stored events now include `assetMap` (remote URL → local file URI).
- Hydrates dates, handles JSON strings nested in event fields.

### Event List Screen & App Entry (`packages/native-app/app/index.tsx`)
- Initializes the database and the new asset cache before rendering events.
- Loads cached events immediately, refreshes from Firestore when online, auto-refreshes when connectivity is restored.
- Adds header-left “Refresh Events” button; if offline, shows cached data and avoids cache clearing.

### Survey Screen (`packages/native-app/src/screens/SurveyScreen.tsx`)
- Uses `assetMap` to replace asset URLs inside SurveyJS JSON/theme before passing to WebView.
- Offline fallback UI shown while prepared event is loading.

## Build & Test Status (as of this handoff)

1. **Survey bundle rebuilt via Vite** – succeeded; output re-generated at `packages/native-app/assets/survey/index.htmlx`.
2. **Expo iOS build (`npx expo run:ios --device "iPad (A16)"`)** – succeeded and installed on simulator.
3. **Runtime testing** – Launch shows “Could not connect to development server” because Metro server was not running. We attempted `npx expo start --tunnel`, but in non-interactive shell the CLI requires confirmation to install `@expo/ngrok`. No assets or cache logic were exercised beyond launch wizard due to this blocker.

## Outstanding Tasks / Next Steps

1. Start Metro normally (e.g., `npx expo start --metro-config metro.config.js`) or run `expo start` interactively to answer the ngrok prompt, so the simulator connects to the bundle.
2. Once Metro is up, relaunch the native app from Xcode/Expo Go and verify:
   - Survey SPA loads with Ford/Lincoln styling offline.
   - External assets (fonts, images) render when device is offline (test by toggling simulator network).
   - “Refresh Events” header button updates event list and retains cached assets if offline.
3. If remote assets need pre-population, consider adding a background prefetch (e.g., at login) using `AssetCacheService`.
4. Optional polish: add instrumentation/logging to observe cache hits/misses, expose manual cache diagnostics, or persist the asset manifest in SQLite if needed.

## Reference Paths

- Asset cache service: `packages/native-app/src/services/asset-cache.ts`
- Event cache updates: `packages/native-app/src/services/event-cache.ts`
- Survey bundle writer: `packages/native-app/src/utils/surveyBundleManager.ts`
- Asset URL helpers: `packages/native-app/src/utils/asset-urls.ts`
- Event list entrypoint (refresh button, cache load): `packages/native-app/app/index.tsx`
- Survey screen rewrite logic: `packages/native-app/src/screens/SurveyScreen.tsx`

## Notes for Future Work

- TypeScript `pnpm type-check` currently fails due to existing upstream typing gaps (`expo-asset`, `Brand` export, expo-file-system types). We did not change those files; they remain unresolved in the repo.
- Metro “Could not connect” error will recur until a Metro server is running on `http://10.211.55.4:8081`. That’s expected on new machines; run `expo start` first.
- The asset cache currently lives in `documentDirectory/asset-cache`. If migrating to Android later, confirm that path rules & permissions still hold.

This document should help whoever continues the work to pick up from the current state without re-auditing the diff. Let me know if more detail is needed.
