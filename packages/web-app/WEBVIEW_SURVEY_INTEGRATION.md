# WebView Survey Bundle Integration Guide

## Overview

This system provides **offline-first survey bundles** for React Native WebView, with brand-specific builds for Ford, Lincoln, and Other/unbranded surveys.

**Status:** ✅ Other bundle successfully built and tested (2.5MB, 518KB gzipped)
**Pending:** Ford/Lincoln bundles require ford-ui components sync

---

## Architecture

### Three-Bundle System

Each brand gets its own isolated bundle to prevent question type conflicts:

| Bundle | Size | Includes | Question Types |
|--------|------|----------|---------------|
| **Ford** | ~2-3MB | React + SurveyJS + FDS + Ford questions | FMC + FordSurveysNew + AllSurveys |
| **Lincoln** | ~2-3MB | React + SurveyJS + FDS + Lincoln questions | FMC + LincolnSurveys + AllSurveys |
| **Other** | ~2.5MB ✅ | React + SurveyJS (standard) | AllSurveys only |

### File Locations

**Shared Types** (`packages/shared/src/types/`):
```
types/
└── webview-bridge.ts            # TypeScript definitions for WebView ↔ Native messages
                                 # Includes: SurveyConfig, SurveyCompletionData,
                                 # NativeToWebViewMessage, WebViewToNativeMessage
```

**Source Code** (`packages/web-app/src/survey-spa/`):
```
survey-spa/
├── SurveyWebViewApp.tsx         # Shared base component (used by all brands)
├── ford/
│   ├── index.tsx                # Ford entry point
│   └── index.html               # Ford HTML template
├── lincoln/
│   ├── index.tsx                # Lincoln entry point
│   └── index.html               # Lincoln HTML template
└── other/
    ├── index.tsx                # Other entry point
    └── index.html               # Other HTML template
```

**Build Configs** (`packages/web-app/`):
```
vite.config.survey-ford.ts
vite.config.survey-lincoln.ts
vite.config.survey-other.ts
```

**Output** (`packages/native-app/assets/survey/`):
```
survey/
└── index.html    # Single HTML file with ALL assets inlined (brand-specific)
```

**Native Component**:
```
packages/native-app/src/components/OfflineSurveyWebView.tsx
```

---

## Build Process

### Building All Bundles

From `packages/web-app`:

```bash
# Build all three bundles
pnpm run build:survey-offline

# Or build individually
pnpm run build:survey-ford      # → Ford bundle
pnpm run build:survey-lincoln   # → Lincoln bundle
pnpm run build:survey-other     # → Other bundle
```

### ⚠️ Ford/Lincoln Prerequisites

**Before building Ford or Lincoln bundles**, you must sync the ford-ui components:

```bash
cd packages/web-app
./scripts/sync-ford-ui.sh
```

This populates `packages/ford-ui/` with the Ford Design System components needed by FDS renderers.

### Build Output

Each build creates a **single, self-contained HTML file** at:
```
packages/native-app/assets/survey/index.html
```

⚠️ **Important**: Each build **overwrites** `index.html`. For production, you'd build each bundle and rename them (e.g., `ford.html`, `lincoln.html`, `other.html`).

### Current Status

- ✅ **Other bundle**: Builds successfully (2.5MB / 518KB gzipped)
- ⏳ **Ford bundle**: Needs ford-ui sync
- ⏳ **Lincoln bundle**: Needs ford-ui sync

---

## WebView Bridge Protocol

Communication between React Native and the survey WebView uses **postMessage**.

### Message Types

#### Native → WebView

```typescript
{
  type: 'SURVEY_INIT',
  payload: {
    surveyJSON: any;         // SurveyJS JSON definition
    brand: 'Ford' | 'Lincoln' | 'Other';
    eventId: string;
    responseId?: string;
    answers?: Record<string, any>;  // Pre-fill existing answers
    theme?: any;             // SurveyJS theme
    locale?: string;         // Language code (en, es, fr)
  }
}
```

#### WebView → Native

```typescript
// Page loaded and ready
{
  type: 'PAGE_LOADED',
  payload: { ready: true, timestamp: string, brand: string }
}

// Survey initialized and ready for input
{
  type: 'SURVEY_READY',
  payload: { pageCount: number, currentPage: number, surveyId: string }
}

// User completed survey
{
  type: 'SURVEY_COMPLETE',
  payload: {
    answers: Record<string, any>;
    eventId: string;
    completedAt: string;
    duration: number;
    device_survey_guid: string;
  }
}

// Survey error occurred
{
  type: 'SURVEY_ERROR',
  payload: { error: string, stack?: string }
}

// User navigated pages
{
  type: 'PAGE_CHANGED',
  payload: { pageNo: number, totalPages: number, pageName?: string }
}

// Question value changed
{
  type: 'VALUE_CHANGED',
  payload: { name: string, value: any, question?: string }
}

// Progress save requested
{
  type: 'SAVE_PROGRESS',
  payload: {
    answers: Record<string, any>;
    currentPage: number;
    isCompleted: boolean;
    eventId: string;
  }
}

// Console log from WebView (debugging)
{
  type: 'CONSOLE_LOG',
  payload: { message: string, data?: string }
}
```

---

## Native Integration

### Using OfflineSurveyWebView Component

```typescript
import { OfflineSurveyWebView } from './components/OfflineSurveyWebView';
import type { SurveyCompletionData } from '@meridian-event-tech/shared/types';

function MySurveyScreen() {
  const event = {
    id: 'event-123',
    brand: 'Other',  // or 'Ford' | 'Lincoln'
    questions: { /* SurveyJS JSON */ },
    theme: { /* optional theme */ },
    locale: 'en'
  };

  const handleSurveyComplete = (data: SurveyCompletionData) => {
    console.log('Survey completed:', data.answers);
    console.log('Survey GUID:', data.device_survey_guid);
    // Save to Firestore, sync to server, etc.
  };

  return (
    <OfflineSurveyWebView
      event={event}
      responseId="response-456"
      existingAnswers={{ /* pre-fill data */ }}
      onSurveyComplete={handleSurveyComplete}
      onSurveyError={(error) => {
        console.error('Survey error:', error);
      }}
      onProgressSave={(data) => {
        console.log('Save progress:', data);
        // Auto-save to local storage
      }}
      onPageChanged={(pageNo, totalPages) => {
        console.log(`Page ${pageNo} of ${totalPages}`);
      }}
    />
  );
}
```

### Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `event` | `SurveyEvent` | ✅ | Event object with brand, questions, theme |
| `responseId` | `string` | ❌ | Existing response ID (for editing) |
| `existingAnswers` | `Record<string, any>` | ❌ | Pre-fill survey with existing data |
| `onSurveyComplete` | `(data) => void` | ❌ | Called when survey is submitted |
| `onSurveyError` | `(error) => void` | ❌ | Called on survey errors |
| `onProgressSave` | `(data) => void` | ❌ | Called when progress should be saved |
| `onPageChanged` | `(pageNo, totalPages) => void` | ❌ | Called when user navigates pages |
| `style` | `ViewStyle` | ❌ | Custom container styles |

---

## Communication Flow

```
┌─────────────────┐                           ┌──────────────────┐
│  React Native   │                           │  Survey WebView  │
│                 │                           │                  │
│  1. Load HTML   │──────────────────────────>│                  │
│                 │     (require bundle)      │                  │
│                 │                           │                  │
│                 │<──────────────────────────│  2. PAGE_LOADED  │
│                 │                           │                  │
│  3. SURVEY_INIT │──────────────────────────>│                  │
│     (config)    │   (injectJavaScript)      │                  │
│                 │                           │                  │
│                 │<──────────────────────────│  4. SURVEY_READY │
│                 │                           │                  │
│                 │      [User fills survey]  │                  │
│                 │                           │                  │
│                 │<──────────────────────────│  5. VALUE_CHANGED│
│                 │<──────────────────────────│     PAGE_CHANGED │
│                 │<──────────────────────────│     SAVE_PROGRESS│
│                 │                           │                  │
│                 │<──────────────────────────│  6. SURVEY_      │
│  7. Save data   │                           │     COMPLETE     │
│     to storage  │                           │                  │
└─────────────────┘                           └──────────────────┘
```

---

## Features

### ✅ Implemented

- **Three-bundle architecture** - Isolated brand builds prevent conflicts
- **Offline-first** - Single HTML file, no external dependencies
- **iPad-optimized** - 44px touch targets, 16px fonts (no iOS zoom)
- **WebView bridge** - Bidirectional React Native ↔ WebView communication
- **Progress auto-save** - Automatic progress tracking
- **Kiosk mode** - Disabled context menu, text selection, dev tools
- **Custom renderers** - All SurveyJS custom question types included
- **Ford Design System** - FDS renderers for Ford/Lincoln brands
- **Multi-language** - Locale support (en, es, fr)
- **Markdown support** - Question text and completion messages
- **Email validation** - Custom validators registered
- **Required field handling** - Automatic validator injection

### 📱 iPad Optimizations

```css
/* Touch targets */
button, input, select, textarea { min-height: 44px; }

/* Prevent iOS zoom on input focus */
input, select, textarea { font-size: 16px !important; }

/* Disable bounce scrolling */
body { overscroll-behavior: none; }

/* Kiosk mode - disable text selection */
* { -webkit-user-select: none; }
input, textarea { -webkit-user-select: text; }
```

---

## Troubleshooting

### Build Errors

**"Cannot find module '@nx/react/tailwind'"**
- Fixed by disabling PostCSS in survey Vite configs
- Survey bundles use inline styles, no Tailwind needed

**"Could not load .../ford-ui-components/src"**
- Run `./packages/web-app/scripts/sync-ford-ui.sh` first
- Ford/Lincoln bundles require FDS components

**"Cannot resolve survey-core/defaultV2.min.css"**
- Fixed by loading CSS via `<link>` tag in HTML instead of import
- CSS is inlined by `vite-plugin-singlefile` during build

### Runtime Errors

**Survey not initializing**
- Check browser console for `PAGE_LOADED` message
- Verify `SURVEY_INIT` message is sent via `injectJavaScript()`
- Check that `surveyJSON` is valid SurveyJS format

**Custom questions not working**
- Verify correct bundle for brand (Ford questions won't work in Other bundle)
- Check console for question registration errors
- Ensure question type is spelled correctly in JSON

**WebView blank/white screen**
- Enable WebView debugging: `webViewRef.current?.reload()`
- Check iOS simulator console for errors
- Verify HTML file exists at expected path

---

## Next Steps

### To Complete Ford/Lincoln Bundles

1. **Sync Ford UI components**:
   ```bash
   cd packages/web-app
   ./scripts/sync-ford-ui.sh
   ```

2. **Build Ford bundle**:
   ```bash
   pnpm run build:survey-ford
   ```

3. **Rename output**:
   ```bash
   cd ../native-app/assets/survey
   mv index.html ford.html
   ```

4. **Build Lincoln bundle**:
   ```bash
   cd ../../web-app
   pnpm run build:survey-lincoln
   cd ../native-app/assets/survey
   mv index.html lincoln.html
   ```

5. **Update bundle selection** in `OfflineSurveyWebView.tsx`:
   ```typescript
   function getSurveyBundlePath(brand: 'Ford' | 'Lincoln' | 'Other') {
     switch (brand) {
       case 'Ford':
         return require('../../assets/survey/ford.html');
       case 'Lincoln':
         return require('../../assets/survey/lincoln.html');
       case 'Other':
         return require('../../assets/survey/other.html');
     }
   }
   ```

### Production Deployment

1. Build all three bundles
2. Rename to `ford.html`, `lincoln.html`, `other.html`
3. Update `OfflineSurveyWebView.tsx` bundle paths
4. Test each bundle in iOS simulator
5. Build native app with EAS

---

## Technical Details

### Bundle Contents

Each HTML file contains (inlined):
- React 18.3.1 + React-DOM
- SurveyJS 2.3.1 (Core + React UI)
- Showdown (markdown converter)
- UUID (for generating survey GUIDs)
- All custom question types
- All custom renderers
- Ford Design System (Ford/Lincoln only)
- All fonts (base64 embedded)
- All CSS (inline styles)

### File Sizes

| Bundle | Uncompressed | Gzipped | Load Time (3G) |
|--------|--------------|---------|----------------|
| Other | 2.5MB | 518KB | ~2-3s |
| Ford | ~2-3MB | ~500-600KB | ~2-3s |
| Lincoln | ~2-3MB | ~500-600KB | ~2-3s |

### iOS WebView Targets

Vite configs target Safari 11.1+ (iOS 11+):
```typescript
target: ['safari11.1', 'ios11']
```

---

## Support

For questions or issues:
1. Check console logs (both Native and WebView)
2. Enable WebView debugging
3. Review this guide
4. Check CLAUDE.md for project context

---

**Last Updated**: 2025-10-09
**Status**: Other bundle ✅ | Ford/Lincoln ⏳ ford-ui sync required
