# Meridian Native App Agent Briefing

## Monorepo Context
- Location: `/Users/shan/dev/expanse-marketing-monorepo`
- Firebase-driven survey platform called **Meridian**
- Primary packages:
  - `packages/firebase-*`: Firestore, Functions, Storage services
  - `packages/ford-ui`: Ford Design System (FDS) component library (external, do not modify)
  - `packages/web-app`: Production web client (works today, keep behavior stable)
  - `packages/native-app`: Expo (iOS) app under development for offline surveys

## Native App Architecture
- Expo/React Native shell renders surveys inside a `WebView` (`OfflineSurveyWebView.tsx`)
- Survey bundle lives at `packages/native-app/assets/survey/index.htmlx`
  - ~10.5 MB single-file bundle loaded via `file://`
  - Produced from web-app survey SPA using Vite + `vite-plugin-singlefile` (IIFE output)
- Survey SPA source: `packages/web-app/src/survey-spa/`
  - Entry: `index.tsx` statically imports SurveyJS, FDS renderers, CSS
  - Main component: `SurveyWebViewApp.tsx` handles initialization + RN bridge messages
  - FDS initializer: `src/helpers/fdsInitializer.ts` (shared with web app; avoid changes)

## Known Constraints
- iOS-only Expo project; **do not touch** `packages/native-app/ios` (generated)
- Must keep bundle fully inlined (no external assets, no network dependency)
- Must keep IIFE format to support `file://` loading in WebView
- `fdsInitializer.ts` is shared; modifying it risks breaking the web app
- Approval mode: `never` (cannot request escalations; work within default permissions)
- Node version: 20 (see `.nvmrc`)

## Build & Test Workflow
1. **Build survey bundle (web app)**
   ```bash
   cd packages/web-app
   npx vite build --config vite.config.survey.ts
   ```
   - Outputs `packages/native-app/assets/survey/index.htmlx`
   - Verify MD5 if needed: `md5 packages/native-app/assets/survey/index.htmlx | awk '{print $4}'`
   - Current known-good MD5: `c80e510082bea5c2cb363b5447fce9a6`
2. **Rebuild native app (Expo)**
   ```bash
   cd packages/native-app
   npx expo run:ios --device "iPad (A16)"
   ```
   - Do **not** use the `--dev-client` flag; stick with `npx expo run:ios` only
   - Also use `npx expo start` for Metro when appropriate
   - Simulator access available via MCP `mobile` tools

## Current Technical Status
- React error #310 (infinite loop) resolved by removing bridge logging during render
- FDS renderers now registered manually in `SurveyWebViewApp.tsx` (post-init function)
- Survey loads and functions offline in WebView
- **Outstanding issue:** Ford UI component styling missing inside WebView bundle
  - Ford-specific logic (e.g., “(Optional)” labels) proves renderers execute
  - UI shows unstyled HTML inputs instead of Ford-styled components
  - Hypothesis space: CSS scoping/order, WebView isolation, single-file bundle quirks

## Operational Notes
- Prefer `rg` for repo searches
- Use `apply_patch` for file edits when practical; maintain ASCII
- Add comments sparingly and only when clarifying non-obvious code
- Never revert unrelated existing changes
- If unexpected repo changes appear, stop and ask the user before proceeding
