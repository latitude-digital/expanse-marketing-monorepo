# Expanse Marketing Monorepo

This monorepo contains the complete Expanse Marketing survey SAAS platform with React web application, Firebase Cloud Functions, and Ford UI v2 components integration featuring advanced three-way brand switching capabilities.

## Repository Structure

```
packages/
├── web-app/          # React web application (Vite + React 18)
│   ├── src/          # Source code with Ford UI v2 integration
│   │   ├── styles/   # Ford/Lincoln CSS files with theme scoping
│   │   │   ├── ford/     # Ford brand CSS (theme-scoped)
│   │   │   └── lincoln/  # Lincoln brand CSS (theme-scoped)
│   │   ├── surveysjs_renderers/ # SurveyJS v2 custom renderers
│   │   │   └── FDSRenderers/    # Ford Design System renderers
│   │   └── screens/  # Application screens with brand switching
│   ├── scripts/      # Ford UI sync and automation scripts
│   ├── dist/         # Production build output
│   └── vite.config.ts # Vite configuration
├── firebase/         # Firebase Cloud Functions (TypeScript)
│   ├── src/          # Functions source code
│   ├── lib/          # Compiled JavaScript output
│   └── firebase.json # Functions configuration
└── ford-ui/          # Ford UI v2 components (git submodule)
    └── packages/@ui/ # Pre-built Ford components and themes
```

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + SurveyJS v2.2.6
- **Backend**: Firebase Cloud Functions + Firestore
- **Design System**: Ford UI v2 + Tailwind CSS with theme-scoped variables
- **Survey Engine**: SurveyJS v2 with custom Ford Design System renderers
- **Package Management**: pnpm workspaces
- **Build Tools**: Vite (web-app), TypeScript (functions)
- **Authentication**: Firebase Auth + CloudFront signed cookies
- **Brand Switching**: Three-way Ford/Lincoln/Unbranded theme system

## Prerequisites

- Node.js 20.13.1+
- pnpm installed globally (`npm install -g pnpm`)
- Git with submodule support

## Initial Setup

### For New Team Members

```bash
# Clone with submodules (recommended)
git clone --recursive https://github.com/latitude-digital/expanse-marketing-monorepo.git

# OR initialize submodules after regular clone
git clone https://github.com/latitude-digital/expanse-marketing-monorepo.git
cd expanse-marketing-monorepo
git submodule update --init --recursive

# Install dependencies
pnpm install

# Update Ford UI (builds components + syncs CSS with theme scoping)
pnpm ford-ui:update
```

## Development Workflow

### Quick Start

```bash
# Install dependencies (from workspace root)
pnpm install

# Update Ford UI (builds components + syncs CSS with theme scoping)
pnpm ford-ui:update

# Start development environment (recommended)
pnpm dev:all  # Starts Firebase emulators + web-app
```

### Available Scripts Summary

| Command | Description |
|---------|-------------|
| `pnpm dev:web` | Start web app in dev mode (local Firebase) |
| `pnpm dev:all` | Start Firebase emulators + web app + auto-open browsers (recommended) |
| `pnpm staging:web` | Start web app pointing to staging Firebase |
| `pnpm production:web` | Start web app pointing to production Firebase |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm deploy:staging` | Deploy to staging environment |
| `pnpm deploy:production` | Deploy to production environment |

### Development Commands

```bash
# Web Application Development
pnpm --filter @expanse/web-app dev          # Start Vite dev server (port 8001, uses .env.dev)
pnpm --filter @expanse/web-app build        # Build for development
pnpm --filter @expanse/web-app build:staging # Build for staging
pnpm --filter @expanse/web-app build:production # Build for production
pnpm --filter @expanse/web-app preview      # Preview production build

# Firebase Emulators
pnpm firebase:emulators                     # Start emulators (Functions, Firestore) - Auth uses live Firebase

# Full-stack Development
pnpm dev:web                                 # Start web app dev server only (local dev)
pnpm dev:all                                 # Start emulators + web app + auto-open Admin & Emulator UI
pnpm staging:web                             # Start web app pointing to staging environment
pnpm production:web                          # Start web app pointing to production environment
pnpm build                                   # Build all packages
pnpm test                                    # Run all tests

# Ford UI Components & CSS Sync
pnpm ford-ui:update                                      # Update components + sync CSS
cd packages/ford-ui && nx run storybook:storybook       # Storybook (port 4400)
```

### Local Development URLs

- **Web App**: http://localhost:8001 (Vite dev server)
- **Admin Dashboard**: http://localhost:8001/admin (requires authentication)
- **Survey Testing**: http://localhost:8001/survey (with brand switching)
- **Firebase Emulator UI**: http://localhost:4002
- **Functions Emulator**: http://localhost:5001
- **Firestore Emulator**: http://localhost:8080
- **Storybook**: http://localhost:4400

**Note**: Auth uses live Firebase Auth (not emulated)

## Ford Design System Integration

### Complete Brand & Theme Switching Architecture

Our implementation supports seamless switching between Ford/Lincoln brands and light/dark themes:

```typescript
// Complete theme switching implementation (FDS_Demo.tsx)
const [currentBrand, setCurrentBrand] = useState<'ford' | 'lincoln'>('ford');
const [theme, setTheme] = useState<'light' | 'dark'>('light');

// Dynamic theme class generation for all four combinations
<div id="fd-nxt" className={
    currentBrand === 'ford' ? `ford_${theme}` : `lincoln_${theme}`
}>
  {/* Supports: ford_light, ford_dark, lincoln_light, lincoln_dark */}
```

### Ford UI CSS Architecture (UPDATED 2025-07-30)

**✅ FIXED**: Now uses original Ford UI source files with correct CSS variable names, bypassing broken CSS generator.

**Critical Fix Applied**: The Ford UI CSS generator produces incorrect variable names. Components expect `--semantic-color-fill-onlight-interactive` but generator produces `--semantic-ford-fill-interactive`. Our sync script now copies original source files directly:

```bash
# NEW (WORKING) - Copies original Ford UI source files:
cp "$FORD_SOURCE/ford/_variables.css" "$WEB_APP_DEST/ford/ford-source.css"
sed 's/:root/.ford_light/g' "$WEB_APP_DEST/ford/ford-source.css" > "$WEB_APP_DEST/ford/ford-light.css"
sed 's/:root/.ford_dark/g' "$WEB_APP_DEST/ford/ford-source.css" > "$WEB_APP_DEST/ford/ford-dark.css"

# OLD (BROKEN) - Used broken CSS generator:
# node src/lib/generators/generate-css.js
```

**Output**: CSS files with correct variable names that components actually use:
- `ford.css` → Contains `.ford_light` and `.ford_dark` with correct `--semantic-color-*` variables
- `lincoln.css` → Contains `.lincoln_light` and `.lincoln_dark` with correct variable names

### Theme-Scoped CSS Variables

**Critical Principle**: CSS variables are theme-scoped to enable conflict-free brand switching.

```css
/* ✅ FIXED: Theme-scoped variables with CORRECT names */
.ford_light {
  --semantic-color-text-onlight-moderate-default: #333333ff;
  --semantic-color-fill-onlight-interactive: #0562d2ff;
  --semantic-radius-sm: 4;
  --semantic-space-md: 12;
  /* ...300+ variables with correct semantic-* naming */
}

.ford_dark {
  --semantic-color-text-onlight-moderate-default: #333333ff;
  --semantic-color-fill-onlight-interactive: #0562d2ff;
  --semantic-radius-sm: 4;
  --semantic-space-md: 12;
  /* Same variables (Ford dark theme needs separate source) */
}

.lincoln_light {
  --semantic-color-text-onlight-moderate-default: #333333ff;
  --semantic-color-fill-onlight-interactive: #0562d2ff;
  --semantic-radius-sm: 4;
  /* Lincoln-specific values with correct variable names */
}
```

**Key Fix**: Variables now use correct `--semantic-color-*` naming that Ford UI components expect, not broken `--semantic-ford-*` names from CSS generator.

### Ford UI CSS Import Strategy

**Critical Learning**: Use absolute paths to prevent context-dependent resolution issues.

```scss
/* ✅ CORRECT: Absolute paths with cleaned up imports (UPDATED 2025-07-30) */
@import '/src/styles/ford/ford.css';
@import '/src/styles/lincoln/lincoln.css';
@import '/src/styles/ford/ford-font-families.css';
@import '/src/styles/lincoln/lincoln-font-families.css';

/* ✅ CLEANED UP: Removed redundant semantic-variables.css imports */
/* Semantic variables (spacing, radius, border-width) are now included */
/* within the theme-scoped ford.css and lincoln.css files */
```

### Automated CSS Generation & Sync (UPDATED 2025-07-30)

The `sync-ford-ui.sh` script includes comprehensive fixes for Ford UI integration:

```bash
# Run the comprehensive Ford UI update command
pnpm ford-ui:update

# ✅ FIXED: What it actually does now:
# 1. Updates Ford UI submodule to latest version (optional)
# 2. Copies ORIGINAL Ford UI _variables.css files with correct variable names
# 3. Applies theme scoping transformations (:root → .ford_light, .ford_dark)
# 4. FIXED: Converts Lincoln font URLs from protocol-relative to HTTPS
# 5. FIXED: Adds complete typography classes to index.scss for font inheritance
# 6. Generates CSS files with all four theme classes
# 7. Components can now find expected --semantic-color-* variables

# The script creates:
# - ford.css with .ford_light and .ford_dark classes and CORRECT variable names
# - lincoln.css with .lincoln_light and .lincoln_dark classes and CORRECT variable names
# - Each theme contains 300+ properly scoped CSS variables with semantic-* naming
# - Complete typography classes (.text-ford-body2-regular, etc.) with all CSS properties
# - Working Lincoln fonts (HTTPS URLs) that load properly in development
```

**✅ CRITICAL FIXES APPLIED (2025-07-30)**: 
1. **CSS Variables**: Uses original Ford UI source files with correct `--semantic-color-*` variable names
2. **Lincoln Fonts**: Converts protocol-relative URLs to HTTPS for proper font loading
3. **Typography Classes**: Adds complete Ford UI typography classes for proper font inheritance
4. **Button Styling**: Now matches Storybook pixel-perfectly

### SurveyJS v2 Custom Renderer Integration

Custom Ford Design System renderers for SurveyJS components:

```typescript
// Custom TextField renderer using Ford UI StyledTextField
import { StyledTextField } from '@ui/ford-ui-components/src/v2/inputField/Input';

// Register custom renderer with SurveyJS v2
ReactQuestionFactory.Instance.registerQuestion('text', (props) => {
  return (
    <StyledTextField
      label={props.question.title}
      value={props.question.value || ''}
      onChange={(e) => props.question.value = e.target.value}
      isRequired={props.question.isRequired}
      className="ford-component-input-color"
    />
  );
});
```

### CSS Bridge Classes

Bridge classes connect SurveyJS expectations with Ford UI styling:

```scss
/* Bridge classes for StyledTextField component integration */
.text-ford-body1-regular {
  @apply body-1-regular;
}

.text-ford-text-moderate\(default\) {
  color: var(--semantic-color-text-onlight-moderate-default);
}

.border-ford-fill-moderate\(default\) {
  border-color: var(--semantic-color-stroke-onlight-moderate-default);
}

.ford-component-input-color {
  color: var(--semantic-color-text-onlight-moderate-default);
}
```

## Complete Brand & Theme Implementation

### Ford Light Theme Features
- **Colors**: Ford blue primary palette (#0066cc, #1a1a1a text)
- **Typography**: FordF1 font family
- **Background**: Light background with dark text
- **Interactive**: Blue buttons and links

### Ford Dark Theme Features
- **Colors**: Ford blue with dark palette (#4d9fff, #ffffff text)
- **Typography**: FordF1 font family
- **Background**: Dark background with light text
- **Interactive**: Brighter blue for dark mode accessibility

### Lincoln Light Theme Features  
- **Colors**: Lincoln burgundy palette (#8b1538, #1a1a1a text)
- **Typography**: LincolnSerif and LincolnFont families
- **Background**: Light background with dark text
- **Interactive**: Burgundy buttons and luxury styling

### Lincoln Dark Theme Features
- **Colors**: Lincoln burgundy with dark palette (#b91d42, #ffffff text)
- **Typography**: LincolnSerif and LincolnFont families
- **Background**: Dark background with light text
- **Interactive**: Brighter burgundy for dark mode accessibility

### Unbranded Theme Features (Custom)
- **Colors**: Neutral grays (#333333, #666666, #cccccc)
- **Typography**: System fonts (-apple-system, BlinkMacSystemFont, Roboto)
- **Components**: Clean, minimal styling
- **Usage**: Fallback theme for non-Ford/Lincoln contexts

## Component Usage Patterns

### Foundation Components with Brand Awareness

```typescript
// StyledTextField automatically respects current brand theme
import { StyledTextField } from '@ui/ford-ui-components/src/v2/inputField/Input';

export function BrandAwareInput({ label, ...props }) {
  return (
    <StyledTextField
      label={label}
      className="ford-component-input-color"
      {...props}
    />
  );
}
```

### Theme-Aware Custom Components

```typescript
// Components that adapt to current brand context
export function BrandAwareButton({ children, ...props }) {
  return (
    <button 
      className="
        px-4 py-2 rounded-[var(--semantic-radius-sm)] 
        bg-[var(--semantic-color-fill-onlight-interactive)]
        text-[var(--semantic-color-text-onlight-strong)]
        hover:bg-[var(--semantic-color-fill-onlight-interactive-hover)]
      "
      {...props}
    >
      {children}
    </button>
  );
}
```

## Production Build

```bash
# Build all packages with proper theme integration
pnpm build

# Build commands
pnpm build                                   # Build all packages
pnpm --filter @expanse/web-app build        # Build web app for development
pnpm --filter @expanse/web-app build:staging # Build web app for staging
pnpm --filter @expanse/web-app build:production # Build web app for production

# Build with Ford UI update
pnpm ford-ui:update && pnpm build
```

## Deployment

### Firebase Deployment

```bash
# Deploy to production
pnpm deploy:production       # Runs production-build-deploy.zsh

# Deploy to staging  
pnpm deploy:staging          # Runs staging-build-deploy.zsh

# The deployment scripts handle:
# - Switching to the correct Firebase alias (prod/staging)
# - Loading the appropriate .env files automatically
# - Building and deploying both web app and functions
```

### Environment Configuration

The project uses consistent environment file naming across packages:

#### Firebase Configuration
Firebase configuration files are located in `packages/firebase/`:
- `.firebaserc` - Contains Firebase project aliases
- `firebase.json` - Firebase services configuration (Functions, Firestore, Emulators)

**Firebase Aliases** (`packages/firebase/.firebaserc`):
```json
{
  "projects": {
    "dev": "latitude-lead-system",
    "staging": "latitude-lead-system", 
    "prod": "latitude-lead-system"
  }
}
```

#### Environment Files

**Firebase Functions** (`packages/firebase/`):
```bash
# .env.dev (development)
LATITUDE_ENV=development
DB_NAME=dev

# .env.staging (staging)
LATITUDE_ENV=staging
DB_NAME=staging

# .env.prod (production)
LATITUDE_ENV=production
DB_NAME=(default)
```

**Web App** (`packages/web-app/`):
```bash
# .env.dev (development)
VITE_ENV=dev
VITE_FIREBASE_PROJECT_ID=latitude-lead-system

# .env.staging (staging)
VITE_ENV=staging
VITE_FIREBASE_PROJECT_ID=latitude-lead-system

# .env.prod (production)
VITE_ENV=production
VITE_FIREBASE_PROJECT_ID=latitude-lead-system
```

The environment files are automatically loaded based on the active Firebase alias or Vite mode:
- Firebase: Uses `firebase use <alias>` which loads `.env.<alias>` 
- Vite: Uses `--mode <mode>` which loads `.env.<mode>`

## Troubleshooting

### Firebase Configuration Issues

**Problem**: `firebase use must be run from a Firebase project directory`
**Solution**: Firebase commands must be run from `packages/firebase/` where `firebase.json` and `.firebaserc` are located. All package.json scripts handle this automatically.

**Problem**: Emulators not starting correctly
**Solution**: Ensure you're in the correct directory and have the right alias:
```bash
cd packages/firebase
firebase use dev  # Should output: Now using alias dev (latitude-lead-system)
firebase emulators:start
```

**Note**: The project uses live Firebase Auth instead of the auth emulator. This means:
- You need internet connection for authentication
- Auth credentials are real (use test accounts for development)
- Other services (Functions, Firestore) are emulated locally

### Ford UI Integration Issues

### CSS Import Resolution Issues

**Problem**: CSS imports fail when BroncoQuiz.scss imports ../index.scss
**Solution**: Use absolute paths in index.scss

```scss
/* ❌ WRONG: Context-dependent relative paths */
@import './styles/ford/_variables.css';

/* ✅ CORRECT: Absolute paths from project root */
@import '/src/styles/ford/_variables.css';
```

### Dark/Light Theme Switching Not Working

**Problem**: Theme switching changes classes but not visual styling
**Root Cause**: Missing dark theme CSS classes (ford_dark, lincoln_dark)
**Solution**: Ensure sync script uses CSS generator, not manual transformations

```bash
# ✅ CORRECT: Uses Ford UI CSS generator
pnpm ford-ui:update

# Verify all four theme classes exist:
grep -n "\.ford_light\|\.ford_dark" packages/web-app/src/styles/ford/ford.css
grep -n "\.lincoln_light\|\.lincoln_dark" packages/web-app/src/styles/lincoln/lincoln.css
```

### Storybook Works But Web-App Doesn't

**Problem**: Themes work in Storybook but fail in web-app
**Root Cause**: Different CSS loading or missing theme classes
**Solution**: Verify CSS imports and theme class availability

```scss
// packages/web-app/src/index.scss - Required imports:
@import '/src/styles/ford/ford.css';
@import '/src/styles/lincoln/lincoln.css';
@import '/src/styles/ford/ford-font-families.css';
@import '/src/styles/lincoln/lincoln-font-families.css';
```

### Tailwind Styles Not Applied

```javascript
// Ensure Ford UI paths are included in Tailwind content
content: [
  './src/**/*.{js,ts,jsx,tsx}',
  '../ford-ui/packages/@ui/ford-ui-components/src/**/*.{js,ts,jsx,tsx}'
]
```

### TypeScript Import Errors

```json
// Add proper path mapping in tsconfig.json
"paths": {
  "@ui/ford-ui-components": ["../ford-ui/packages/@ui/ford-ui-components/src"],
  "@ford-ui/*": ["../ford-ui/packages/@ui/ford-ui-components/src/v2/*"]
}
```

### SurveyJS Component Styling Issues

**Problem**: SurveyJS components don't inherit Ford UI styling
**Solution**: Implement custom renderers with proper CSS bridges

```typescript
// Register custom renderer for text inputs
ReactQuestionFactory.Instance.registerQuestion('text', (props) => {
  return (
    <StyledTextField
      label={props.question.title}
      value={props.question.value || ''}
      onChange={(e) => props.question.value = e.target.value}
      className="ford-component-input-color"
    />
  );
});
```

### Submodule Sync Issues

```bash
# Submodule is empty or missing
git submodule update --init --recursive

# Submodule is out of sync
cd packages/ford-ui
git status
git pull origin develop

# Reset submodule to specific commit
cd packages/ford-ui
git checkout [commit-hash]
cd ../..
git add packages/ford-ui
git commit -m "Pin Ford UI to specific version"
```

### Lincoln Fonts Loading as Times New Roman (FIXED 2025-07-30)

**Problem**: Lincoln theme shows correct `font-family: "LincolnFont"` but renders as Times New Roman
**Root Cause**: Protocol-relative URLs (`//www.lincoln.com/...`) resolve to HTTP, Lincoln servers require HTTPS
**Solution**: ✅ **FIXED** - Sync script now automatically converts Lincoln font URLs to HTTPS

```bash
# ✅ FIXED: Sync script automatically fixes Lincoln font URLs
./packages/web-app/scripts/sync-ford-ui.sh

# Console error pattern:
# Access to font at 'http://www.lincoln.com/cmslibs/etc/designs/common/skin/lincoln/fonts/...'
# Failed to load resource: net::ERR_FAILED
```

### Ford UI Component Labels Not Inheriting Brand Fonts (FIXED 2025-07-30)

**Problem**: Built-in Ford UI component labels (TextArea, Dropdown, etc.) don't switch fonts between Ford/Lincoln themes
**Root Cause**: Ford UI Tailwind presets generate incomplete typography classes (only `font-size`, missing `font-family`, `font-weight`, `line-height`)
**Solution**: ✅ **FIXED** - Sync script now automatically adds complete typography classes to index.scss

```bash
# ✅ FIXED: Sync script automatically adds complete typography classes
./packages/web-app/scripts/sync-ford-ui.sh

# Example of what gets fixed:
# Before: .text-ford-body2-regular { font-size: var(--fontSize-ford-body2-regular); }
# After: Complete class with font-family, font-size, line-height, font-weight

# Verify fix:
grep -A4 "text-ford-body2-regular" packages/web-app/src/index.scss
```

## Version Management

### Updating Ford UI Components

```bash
# Update Ford UI with automatic sync and commit
pnpm ford-ui:update

# Commit the update
git add packages/ford-ui packages/web-app/src/styles/
git commit -m "Update Ford UI components and sync CSS with theme scoping"
```

### Checking Current Version

```bash
# See current Ford UI version
cd packages/ford-ui
git log --oneline -5        # Recent commits
git describe --tags         # Current tag if available
git rev-parse --short HEAD  # Current commit hash
```

## Critical Design System Lessons Learned

### 1. Use Ford UI's Official CSS Generator (Not Manual Transformations)
- **Problem**: Manual sed transformations only created light themes, missing dark support
- **Solution**: Use Ford UI's `generate-css.js` for all four theme classes
- **Result**: Complete theme support matching Storybook exactly

### 2. Complete Theme Architecture Requires Four Classes
- **Essential**: `.ford_light`, `.ford_dark`, `.lincoln_light`, `.lincoln_dark`
- **Each contains**: 300+ theme-scoped CSS variables
- **Enables**: Both brand switching (Ford/Lincoln) and theme switching (light/dark)

### 3. CSS Variable Scoping Prevents Brand Conflicts
- **Problem**: Global `:root` variables cause theme conflicts
- **Solution**: Theme-scoped variables with proper CSS generation
- **Pattern**: Each theme class contains complete variable definitions

### 4. Storybook Consistency is Critical
- **Requirement**: Web-app must use identical theme system as Storybook
- **Implementation**: Same `withThemeByClassName` pattern and theme classes
- **Verification**: Both should support all four theme combinations

### 5. Import Strategy Affects CSS Loading
- **Critical**: Import complete CSS files in index.scss
- **Required**: Both ford.css and lincoln.css must be loaded
- **Pattern**: Absolute paths prevent context-dependent resolution issues

### 6. Theme Wrapper Architecture Enables Inheritance
- **Pattern**: `#fd-nxt` wrapper element with dynamic theme class
- **Inheritance**: CSS variables cascade to all Ford UI child components
- **Control**: Single state change affects entire application theme

### 7. Automation with Official Tools Prevents Errors
- **Tool**: `pnpm ford-ui:update` uses Ford UI's CSS generator
- **Benefits**: Eliminates manual transformation errors and ensures completeness
- **Result**: Consistent theme system across Storybook and web-app

## Getting Help

1. **Storybook Documentation**: Reference component APIs and examples at http://localhost:4400
2. **Ford UI Repository**: Check component source code and tests
3. **Brand Switching**: Test all three themes in Survey component
4. **CSS Debugging**: Use browser DevTools to inspect CSS variable inheritance
5. **Ford UI Update**: Run `pnpm ford-ui:update` when CSS issues occur

---

**Next Steps**: This implementation provides a solid foundation for Ford Design System integration with advanced brand switching capabilities. The theme-scoped CSS architecture supports future brand additions and ensures maintainable, conflict-free styling.