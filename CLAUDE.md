# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository, specifically focusing on Ford Design System integration patterns and lessons learned.

## Project Overview

This is a monorepo for Expanse Marketing, a survey SAAS platform with advanced Ford Design System (FDS) integration. The repository successfully implements three-way brand switching (Ford/Lincoln/Unbranded) with proper CSS variable scoping and SurveyJS v2 custom renderers.

## Component Usage Guidelines

- We should always defer to using ford-ui components/atoms/molecules/etc rather than writing our own code to LOOK like them

## Environment Setup

- Node.js version: 20 (see .nvmrc)
- Use `nvm use` to switch to the correct Node.js version
- The project integrates with Figma via MCP server configuration (.mcp.json)
- **Critical**: Run `./packages/web-app/scripts/sync-ford-ui.sh` after Ford UI updates

## Repository Structure

```
packages/
├── web-app/                    # React web application (Vite + React 18)
│   ├── src/
│   │   ├── styles/             # ⚠️ CRITICAL: Theme-scoped CSS files
│   │   │   ├── ford/           # Ford brand CSS (.ford_light scoped)
│   │   │   └── lincoln/        # Lincoln brand CSS (.lincoln_light scoped)
│   │   ├── surveysjs_renderers/ # SurveyJS v2 custom renderers
│   │   │   └── FDSRenderers/    # Ford Design System renderers
│   │   ├── screens/Survey.jsx   # Main brand switching implementation
│   │   └── index.scss          # ⚠️ CRITICAL: Uses absolute CSS imports
│   ├── scripts/
│   │   └── sync-ford-ui.sh     # ⚠️ CRITICAL: Automated CSS sync with theme scoping
│   └── tailwind.config.js      # Ford UI preset configuration
├── firebase/                   # Firebase Cloud Functions (TypeScript)
└── ford-ui/                   # Ford UI v2 components (git submodule)
    └── packages/@ui/           # Source of truth for Ford components and CSS
```

## Ford Design System (FDS) Complete Architecture

### Overview: How Ford UI Integration Actually Works

The Ford Design System integration is a sophisticated multi-layer architecture that enables dynamic brand and theme switching across Ford, Lincoln, and custom brands with both light and dark mode support.

### 1. The Ford UI CSS Generation System

**Core Generator**: `packages/ford-ui/packages/@ui/fof-styles/src/lib/generators/generate-css.js`

This is the heart of the entire system. It programmatically generates CSS with proper theme scoping:

```javascript
// Generates four complete theme classes:
generateCssVars(colors().fordLightThemes, 'ford_light');
generateCssVars(colors().fordDarkThemes, 'ford_dark');
generateCssVars(colors().lincolnLightThemes, 'lincoln_light');
generateCssVars(colors().lincolnDarkThemes, 'lincoln_dark');
```

**Output**: Complete CSS files with theme-scoped CSS variables:
- `ford.css` → Contains `.ford_light` and `.ford_dark` classes
- `lincoln.css` → Contains `.lincoln_light` and `.lincoln_dark` classes

### 2. CSS Variable Scoping Architecture

**CRITICAL PRINCIPLE**: CSS variables are theme-scoped to enable conflict-free brand switching.

```css
/* ✅ CORRECT: Generated theme-scoped variables */
.ford_light {
  --semantic-color-text-onlight-moderate-default: #1a1a1a;
  --semantic-color-fill-onlight-interactive: #0066cc;
  /* ...300+ variables */
}

.ford_dark {
  --semantic-color-text-onlight-moderate-default: #ffffff;
  --semantic-color-fill-onlight-interactive: #4d9fff;
  /* ...300+ variables with dark theme values */
}

.lincoln_light {
  --semantic-color-text-onlight-moderate-default: #1a1a1a;
  --semantic-color-fill-onlight-interactive: #8b1538;
  /* ...300+ variables with Lincoln brand values */
}

.lincoln_dark {
  --semantic-color-text-onlight-moderate-default: #ffffff;
  --semantic-color-fill-onlight-interactive: #b91d42;
  /* ...300+ variables with Lincoln dark theme values */
}
```

**Why This Works**:
- Each theme class contains complete CSS variable definitions
- No conflicts between brands/themes because variables are scoped
- Theme switching just changes the CSS class on a wrapper element
- All Ford UI components automatically inherit the correct variables

### 3. Tailwind Integration Layer

**Ford UI Tailwind Presets**: The system uses multiple Tailwind presets that provide Ford UI classes:

```javascript
// packages/web-app/tailwind.config.js
presets: [
  require('../ford-ui/tailwindPresets/tailwind.fbc.preset'),
  require('../ford-ui/tailwindPresets/tailwind.nvc.preset'),
  require('../ford-ui/tailwindPresets/tailwind.img.preset'),
  require('../ford-ui/tailwindPresets/tailwind.own.preset'),
  require('../ford-ui/tailwindPresets/tailwind.nabuy.preset'),
],
```

**Theme Color Integration**: Tailwind imports all theme colors for class generation:

```javascript
const {
  fordLightThemes,
  fordDarkThemes,
  lincolnLightThemes,
  lincolnDarkThemes,
  customThemes,
  globalThemes,
} = require('../ford-ui/themes/fofThemes/colors');

const nvcThemeColors = {
  ...fordLightThemes,
  ...fordDarkThemes,
  ...lincolnLightThemes,
  ...lincolnDarkThemes,
  ...customThemes,
  ...globalThemes,
};
```

This enables Tailwind to generate classes like `bg-ford-primary`, `text-lincoln-secondary`, etc.

### 4. The Sync Script Architecture (UPDATED 2025-07-30)

**Critical Tool**: `./packages/web-app/scripts/sync-ford-ui.sh`

This script bridges Ford UI and the web-app by copying original CSS files and applying theme scoping:

```bash
# 1. Updates Ford UI submodule to latest (optional)
git submodule update --remote packages/ford-ui

# 2. Copies ORIGINAL Ford UI source files with correct variable names
cp "$FORD_SOURCE/ford/_variables.css" "$WEB_APP_DEST/ford/ford-source.css"
cp "$FORD_SOURCE/lincoln/_variables.css" "$WEB_APP_DEST/lincoln/lincoln-source.css"

# 3. Applies theme scoping transformations
sed 's/:root/.ford_light/g' "$WEB_APP_DEST/ford/ford-source.css" > "$WEB_APP_DEST/ford/ford-light.css"
sed 's/:root/.ford_dark/g' "$WEB_APP_DEST/ford/ford-source.css" > "$WEB_APP_DEST/ford/ford-dark.css"
cat "$WEB_APP_DEST/ford/ford-light.css" "$WEB_APP_DEST/ford/ford-dark.css" > "$WEB_APP_DEST/ford/ford.css"
```

**Why This Approach (FIXED 2025-07-30)**:
- ✅ **FIXED**: Uses original Ford UI source files with correct `--semantic-color-*` variable names
- ✅ **FIXED**: Bypasses broken CSS generator that produced wrong `--semantic-ford-*` variables  
- ✅ Components can now find expected variables (`--semantic-color-fill-onlight-interactive`)
- ✅ Button styling now matches Storybook pixel-perfectly
- ✅ Eliminates CSS variable naming mismatches
- ✅ Cleaner architecture without redundant semantic-variables.css files

**Critical Fix Applied**: The Ford UI CSS generator (`generate-css.js`) produces incorrect variable names. Components expect `--semantic-color-fill-onlight-interactive` but generator produces `--semantic-ford-fill-interactive`. By copying original source files directly, we get the correct variable names that components actually use.

### 5. Complete Brand/Theme Switching Implementation

**Four-Way Theme Support**: The system supports complete brand and theme combinations:

```typescript
// Example from FDS_Demo.tsx - Complete theme switching
const [currentBrand, setCurrentBrand] = useState<'ford' | 'lincoln'>('ford');
const [theme, setTheme] = useState<'light' | 'dark'>('light');

// Dynamic theme class generation
<div id="fd-nxt" className={
    currentBrand === 'ford' ? `ford_${theme}` : `lincoln_${theme}`
}>
  {/* All Ford UI components inherit theme automatically */}
</div>

// Available theme combinations:
// - ford_light, ford_dark
// - lincoln_light, lincoln_dark
// - unbranded (custom theme)
```

**Storybook Integration**: Uses `withThemeByClassName` decorator:

```javascript
// .storybook/preview.tsx
withThemeByClassName({
  themes: {
    'Ford Light': 'ford_light',
    'Ford Dark': 'ford_dark',
    'Lincoln Light': 'lincoln_light',
    'Lincoln Dark': 'lincoln_dark',
    Custom: 'custom',
  },
  defaultTheme: 'Ford Light',
})
```

**Key Requirements**:
- `#fd-nxt` wrapper element is required for Ford UI components
- Theme class must be applied to wrapper, not individual components
- CSS variables cascade automatically to all child components
- All four theme classes must be available in CSS

### 6. SurveyJS v2 Custom Renderer Integration

**Pattern**: Replace SurveyJS default components with Ford UI components

```typescript
// Register custom renderer for text inputs
import { ReactQuestionFactory } from 'survey-react-ui';
import { StyledTextField } from '@ui/ford-ui-components/src/v2/inputField/Input';

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

**Bridge CSS Classes** (in index.scss):
```scss
.ford-component-input-color {
  color: var(--semantic-color-text-onlight-moderate-default);
}

.text-ford-body1-regular {
  @apply body-1-regular;
}
```

### 5. Automated CSS Sync Workflow

**Critical Tool**: `sync-ford-ui.sh` handles complex CSS transformations

```bash
# What the script does:
# 1. Updates Ford UI submodule to latest
# 2. Copies CSS files from Ford UI source
# 3. Applies sed transformations: :root { → .ford_light { and .lincoln_light {
# 4. Ensures theme scoping for brand switching

# When to run:
./packages/web-app/scripts/sync-ford-ui.sh

# Required after:
# - Ford UI submodule updates
# - CSS variable conflicts
# - Brand switching issues
```

## Development Workflow Guidance

### For New Team Members

1. **Setup with Ford UI**:
```bash
git clone --recursive https://github.com/latitude-digital/expanse-marketing-monorepo.git
cd expanse-marketing-monorepo
pnpm install
cd packages/ford-ui && nx build @ui/ford-ui-components
cd ../..
./packages/web-app/scripts/sync-ford-ui.sh  # ⚠️ CRITICAL STEP
```

2. **Daily Development**:
```bash
# Start development with proper CSS sync
./packages/web-app/scripts/sync-ford-ui.sh
pnpm dev:all
```

3. **Testing Brand Switching**:
- Navigate to Survey component at http://localhost:8001/survey
- Use brand switcher button to cycle Ford → Lincoln → Unbranded → Ford
- Verify CSS variables change in browser DevTools

### CSS Debugging Workflow

1. **Check CSS Variable Inheritance**:
```javascript
// Browser DevTools Console
getComputedStyle(document.documentElement).getPropertyValue('--semantic-color-text-onlight-moderate-default')
```

2. **Verify Theme Class Application**:
```javascript
// Check current theme class on wrapper
document.getElementById('fd-nxt').className
```

3. **CSS Import Resolution Issues**:
- Check browser Network tab for failed CSS imports
- Verify absolute paths in index.scss
- Run sync script to refresh CSS files

## Complete FDS Architecture Flow Diagram (UPDATED 2025-07-30)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Ford UI       │    │   Original CSS   │    │   Web App       │
│   Submodule     │───▶│   Source Files   │───▶│   Styles        │
│                 │    │                  │    │                 │
│ • Color Tokens  │    │ • _variables.css │    │ • ford.css      │
│ • Components    │    │ • Correct vars   │    │ • lincoln.css   │
│ • Font Families │    │ • :root scope    │    │ • index.scss    │
│ • Tailwind      │    │ • semantic-*     │    │                 │
│   Presets       │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────▼────────┐              │
         │              │  sync-ford-ui.sh │              │
         │              │                 │              │
         │              │ 1. Copy source  │              │
         │              │ 2. sed :root→   │              │
         │              │   .ford_light   │              │
         │              │ 3. Theme scope  │              │
         │              └─────────────────┘              │
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   Storybook     │                            │   React App     │
│                 │                            │                 │
│ • Same themes   │                            │ • Theme wrapper │
│ • Original CSS  │                            │ • #fd-nxt       │
│ • Correct vars  │                            │ • CSS cascade   │
│ • Preview.tsx   │                            │ • FIXED styling │
└─────────────────┘                            └─────────────────┘
```

**Key Architecture Change (2025-07-30)**: Bypassed broken CSS generator, now copies original source files directly for correct variable names.

## Common Issues and Solutions

### Issue 1: Button Styling Differences Between Storybook and Web-App (FIXED 2025-07-30)

**Symptoms**: Buttons appear square/rectangular in web-app but rounded in Storybook, different colors
**Root Cause**: CSS variable naming mismatch - components expect `--semantic-color-fill-onlight-*` but CSS generator produces `--semantic-ford-fill-*`
**Solution**: ✅ **FIXED** - Sync script now copies original Ford UI source files with correct variable names

```bash
# ✅ FIXED: Now uses original source files with correct variables
./packages/web-app/scripts/sync-ford-ui.sh

# Verify correct variables are generated:
grep -n "semantic-color-fill-onlight-interactive" packages/web-app/src/styles/ford/ford.css
```

### Issue 2: Dark/Light Theme Switching Not Working

**Symptoms**: Theme toggle changes classes but visual appearance stays the same
**Root Cause**: Missing dark theme CSS classes (ford_dark, lincoln_dark)
**Solution**: Ensure sync script uses CSS generator, not manual transformations

```bash
# ✅ CORRECT: Uses Ford UI CSS generator
./packages/web-app/scripts/sync-ford-ui.sh

# Verify all four theme classes exist:
grep -n "\.ford_light\|\.ford_dark" packages/web-app/src/styles/ford/ford.css
```

### Issue 2: Components Don't Inherit Theme Changes

**Symptoms**: Some components ignore theme switching
**Root Cause**: Missing #fd-nxt wrapper or incorrect CSS variable usage
**Solution**: Ensure proper theme wrapper and CSS variable references

```typescript
// ✅ CORRECT: Ford UI theme wrapper
<div id="fd-nxt" className="ford_light">
  <StyledButton>Uses Ford UI variables</StyledButton>
</div>

// ❌ WRONG: Missing wrapper
<div className="ford_light">
  <StyledButton>May not inherit variables</StyledButton>
</div>
```

### Issue 3: Storybook Works But Web-App Doesn't

**Symptoms**: Themes work in Storybook but fail in web-app
**Root Cause**: Different CSS loading or missing theme classes
**Solution**: Verify CSS imports and theme class availability

```scss
// packages/web-app/src/index.scss - Required imports (UPDATED 2025-07-30):
@import '/src/styles/ford/ford.css';
@import '/src/styles/lincoln/lincoln.css';
@import '/src/styles/ford/ford-font-families.css';
@import '/src/styles/lincoln/lincoln-font-families.css';

// ✅ CLEANED UP: Removed redundant semantic-variables.css imports
// Semantic variables (spacing, radius, border-width) are now included 
// within the theme-scoped ford.css and lincoln.css files
```

### Issue 4: Ford UI Submodule Out of Sync

**Symptoms**: Missing components, build errors, outdated styling
**Solution**: Update submodule and sync CSS

```bash
cd packages/ford-ui
git pull origin develop
cd ../..
./packages/web-app/scripts/sync-ford-ui.sh
git add packages/ford-ui packages/web-app/src/styles/
git commit -m "Update Ford UI and sync CSS with theme scoping"
```

## Ford UI Component Usage Patterns

### Import Patterns

```typescript
// Foundation components (styled versions recommended)
import { StyledTextField } from '@ui/ford-ui-components/src/v2/inputField/Input';
import { StyledButton } from '@ui/ford-ui-components/src/v2/button/Button';

// Use with theme-aware classes
<StyledTextField 
  label="Email"
  className="ford-component-input-color"
/>
```

### Theme-Aware Custom Components

```typescript
// Components that automatically adapt to current brand
export function ThemeAwareComponent({ children }) {
  return (
    <div className="
      bg-[var(--semantic-color-fill-onlight-subtle)]
      text-[var(--semantic-color-text-onlight-moderate-default)]
      border-[var(--semantic-color-stroke-onlight-moderate-default)]
    ">
      {children}
    </div>
  );
}
```

## Critical Commands Reference

```bash
# CSS sync (run after Ford UI changes)
./packages/web-app/scripts/sync-ford-ui.sh

# Development with Ford UI
pnpm dev:all

# Storybook for component reference
cd packages/ford-ui && nx run storybook:storybook

# Build with CSS sync
./packages/web-app/scripts/sync-ford-ui.sh && pnpm build

# Submodule management
git submodule update --init --recursive      # Initialize
git submodule update --remote packages/ford-ui  # Update to latest
```

## Testing and Validation

### Brand Switching Validation

1. **Visual Test**: All three themes should look distinctly different
2. **CSS Variable Test**: Check computed styles change between themes
3. **Component Test**: Ford UI components should inherit theme automatically
4. **SurveyJS Test**: Custom renderers should respect current theme

### CSS Architecture Validation

1. **Scoping Test**: No `:root` selectors in ford/_variables.css or lincoln/_variables.css
2. **Import Test**: No relative paths in index.scss CSS imports
3. **Bridge Test**: CSS bridge classes properly connect SurveyJS to Ford UI

## Performance Considerations

### CSS Bundle Size
- Ford and Lincoln CSS files are loaded together (acceptable for brand switching)
- Unbranded theme uses minimal CSS variables (efficient)
- Bridge classes add minimal overhead

### Runtime Performance
- Theme switching is instant (CSS variable inheritance)
- No JavaScript theme calculations required
- Storybook runs separately, doesn't affect app performance

## Security Considerations

- Survey data handling follows existing SAAS platform patterns
- Ford UI components inherit security patterns from React
- CSS injection risks mitigated by using CSS variables, not dynamic CSS

## Critical Debugging Commands

### Verify Theme CSS Generation (UPDATED 2025-07-30)
```bash
# 1. Check if all four theme classes exist
grep -n "\.ford_light\|\.ford_dark" packages/web-app/src/styles/ford/ford.css
grep -n "\.lincoln_light\|\.lincoln_dark" packages/web-app/src/styles/lincoln/lincoln.css

# 2. Verify correct CSS variable names (CRITICAL)
grep -n "semantic-color-fill-onlight-interactive" packages/web-app/src/styles/ford/ford.css
# Should return: --semantic-color-fill-onlight-interactive: #0562d2ff;

# 3. ✅ FIXED: No longer use broken CSS generator
# OLD (BROKEN): cd packages/ford-ui/packages/@ui/fof-styles && node src/lib/generators/generate-css.js
# NEW (WORKING): ./packages/web-app/scripts/sync-ford-ui.sh

# 4. Verify semantic variables are included in theme-scoped CSS
grep -c "semantic-radius\|semantic-space\|semantic-border-width" packages/web-app/src/styles/ford/ford.css
```

### Browser DevTools Debugging
```javascript
// Check current theme class
document.getElementById('fd-nxt').className

// Inspect CSS variable inheritance
getComputedStyle(document.documentElement).getPropertyValue('--semantic-color-text-onlight-moderate-default')

// Check if theme CSS is loaded
Array.from(document.styleSheets).find(sheet => 
  sheet.href && sheet.href.includes('ford.css')
)
```

### Storybook vs Web-App Comparison
```bash
# Compare Storybook theme classes (should match web-app)
grep -A5 "themes:" packages/ford-ui/apps/storybook/.storybook/preview.tsx

# Verify Tailwind theme integration
grep -A10 "fordDarkThemes\|lincolnDarkThemes" packages/web-app/tailwind.config.js
```

## Key Success Factors (UPDATED 2025-07-30)

1. **✅ FIXED**: **Original Ford UI Source Files**: Use original `_variables.css` files, NOT broken CSS generator
2. **✅ FIXED**: **Correct CSS Variable Names**: Ensure components find expected `--semantic-color-*` variables
3. **Complete Theme Support**: All four theme classes (ford_light, ford_dark, lincoln_light, lincoln_dark)
4. **Clean CSS Architecture**: No redundant semantic-variables.css files, all variables theme-scoped
5. **Theme Wrapper**: `#fd-nxt` with dynamic class enables automatic inheritance
6. **Storybook Consistency**: Web-app uses same theme system as Storybook with matching variable names

## Future Development Guidelines

### Adding New Brands
1. Create new CSS files in `src/styles/[brand]/`
2. Update sync script to handle new brand transformations
3. Add brand option to Survey.jsx state management
4. Define brand-specific CSS variables in index.scss if not from Ford UI

### Updating Ford UI
1. Always run sync script after submodule updates
2. Test all three brands after updates
3. Verify custom renderers still work correctly
4. Check for new components in Storybook

### CSS Architecture Evolution
- Maintain theme scoping pattern for all new brands
- Use absolute paths for all CSS imports
- Keep bridge classes minimal and semantic
- Document any new CSS patterns in this file

---

## Architecture Summary: Complete FDS Integration

**The Ford Design System integration is a sophisticated four-layer architecture:**

### Layer 1: Ford UI Submodule
- Contains color tokens, components, Tailwind presets
- Source of truth for all Ford/Lincoln branding
- Includes CSS generator (`generate-css.js`) for theme creation

### Layer 2: CSS Generation & Theme Scoping  
- Programmatic CSS generation with theme-scoped variables
- Creates four complete theme classes: `ford_light`, `ford_dark`, `lincoln_light`, `lincoln_dark`
- Each theme contains 300+ CSS variables with proper scoping

### Layer 3: Sync & Distribution
- `sync-ford-ui.sh` bridges Ford UI and web-app
- Uses official CSS generator (not manual transformations)
- Ensures Storybook and web-app have identical theme systems

### Layer 4: Runtime Theme Switching
- Dynamic CSS class application on `#fd-nxt` wrapper
- Automatic CSS variable inheritance to all Ford UI components
- Supports both brand switching (Ford/Lincoln) and theme switching (light/dark)

**Critical Success Factors:**
1. **Never use manual CSS transformations** - always use Ford UI's CSS generator
2. **All four theme classes must be available** - ford_light, ford_dark, lincoln_light, lincoln_dark
3. **CSS imports must be complete** - import both ford.css and lincoln.css in index.scss
4. **Theme wrapper is mandatory** - `#fd-nxt` element with dynamic className
5. **Storybook consistency** - web-app must match Storybook's theme system exactly

This architecture enables seamless brand and theme switching across the entire application while maintaining consistency with Ford's official design system and Storybook implementation.

## Custom Survey Question Definitions

Custom SurveyJS question type definitions are in:
`packages/web-app/src/surveyjs_questions/`

These register new question types with SurveyJS (business logic).
Visual presentation is handled by existing renderers in surveysjs_renderers/

**MIGRATION COMPLETED**: Previously these were in the separate meridian-base repository.
As of 2025-07-29, all custom question definitions have been migrated into the web-app package.

### File Structure
```
packages/web-app/src/surveyjs_questions/
├── AllSurveys.ts          # Universal question definitions
├── FordSurveys.ts         # Ford-specific question definitions  
├── LincolnSurveys.ts      # Lincoln-specific question definitions
├── interfaces.d.ts       # TypeScript interfaces for custom questions
└── index.ts              # Exports all modules
```

### Available Question Types

**Universal Questions** (AllSurveys.ts):
- firstname, lastname: Personal information with validation
- email, phone: Communication fields with custom validation
- autocompleteaddress, autocompleteaddress2: Google Address Autocomplete
- optin: Boolean checkbox for agreements

**Ford-Specific Questions** (FordSurveys.ts):
- fordvoi: Ford Vehicle of Interest selector
- fordoptin, fordrecommend, fordrecommendpost: Ford brand engagement
- gender, agebracket, howlikelyacquire: Demographics and purchase intent
- howlikelypurchasingford, howlikelypurchasingfordpost: Purchase likelihood
- inmarkettiming: Purchase timing preferences
- adultwaiver, minorwaiver: Legal waiver components
- vehicledrivenmostmake: Current vehicle brand tracking

**Lincoln-Specific Questions** (LincolnSurveys.ts):
- lincolnvoi: Lincoln Vehicle of Interest selector
- lincolnoptin: Lincoln brand opt-in

### Integration Pattern
Question definitions are initialized in Survey.tsx before survey creation:
```typescript
// Initialize custom question definitions
AllSurveys.globalInit();
FordSurveys.fordInit();
LincolnSurveys.lincolnInit();

const survey = new Model(surveyJSON);
```

Visual rendering handled by existing FDS renderers with Ford/Lincoln/Unbranded theming.

### Migration Notes
- Removed dependency on separate meridian-base repository
- All question definitions now co-located with visual renderers
- Maintains exact same API and functionality as before
- No changes required to existing survey JSON or templates