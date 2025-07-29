# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository, specifically focusing on Ford Design System integration patterns and lessons learned.

## Project Overview

This is a monorepo for Expanse Marketing, a survey SAAS platform with advanced Ford Design System (FDS) integration. The repository successfully implements three-way brand switching (Ford/Lincoln/Unbranded) with proper CSS variable scoping and SurveyJS v2 custom renderers.

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

## Critical Ford UI Integration Patterns

### 1. CSS Variable Scoping Architecture

**CRITICAL LESSON**: CSS variables MUST be theme-scoped to prevent conflicts.

```css
/* ❌ NEVER USE: Global scope causes brand conflicts */
:root {
  --semantic-color-text-onlight-moderate-default: #333333;
}

/* ✅ ALWAYS USE: Theme-scoped variables */
.ford_light {
  --semantic-color-text-onlight-moderate-default: #333333;
}

.lincoln_light {
  --semantic-color-text-onlight-moderate-default: #333333;
}

.unbranded {
  --semantic-color-text-onlight-moderate-default: #333333;
}
```

**Implementation Pattern**:
- Ford UI CSS files use `:root` by default
- sync-ford-ui.sh automatically transforms `:root` → `.ford_light` and `.lincoln_light`
- Manual unbranded theme defined in index.scss

### 2. CSS Import Path Resolution

**CRITICAL LESSON**: Use absolute paths to prevent context-dependent resolution failures.

```scss
/* ❌ WRONG: Fails when imported from subdirectories */
@import './styles/ford/_variables.css';

/* ✅ CORRECT: Works from any import context */
@import '/src/styles/ford/_variables.css';
@import '/src/styles/lincoln/_variables.css';
```

**Root Cause**: BroncoQuiz.scss imports ../index.scss, causing relative paths to resolve from /screens context instead of /src context.

### 3. Three-Way Brand Switching Implementation

**Pattern**: Single state controls entire application theme

```typescript
// Survey.jsx - Brand switching state management
const [currentBrand, setCurrentBrand] = useState('ford'); // 'ford', 'lincoln', or 'unbranded'

// Theme wrapper with dynamic class application
<div id="fd-nxt" className={
    currentBrand === 'ford' ? 'ford_light' : 
    currentBrand === 'lincoln' ? 'lincoln_light' : 
    'unbranded'
}>
  {/* All Ford UI components inherit theme automatically */}
</div>

// Cycling logic for three-way switching
const nextBrand = 
    currentBrand === 'ford' ? 'lincoln' : 
    currentBrand === 'lincoln' ? 'unbranded' : 
    'ford';
```

**Key Requirements**:
- `#fd-nxt` wrapper element is required for Ford UI
- Theme class must be applied to wrapper, not individual components
- CSS variables cascade automatically to child components

### 4. SurveyJS v2 Custom Renderer Integration

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

## Common Issues and Solutions

### Issue 1: Brand Switching Changes Classes But Not Styles

**Symptoms**: Theme classes change but visual appearance stays the same
**Root Cause**: CSS variables defined at `:root` level override theme-scoped variables
**Solution**: Run sync script to ensure theme scoping

```bash
./packages/web-app/scripts/sync-ford-ui.sh
```

### Issue 2: CSS Import "Unable to resolve" Errors

**Symptoms**: Build fails with CSS import errors, especially from subdirectories
**Root Cause**: Relative paths resolve incorrectly from different import contexts
**Solution**: Use absolute paths in index.scss

```scss
/* Change this */
@import './styles/ford/_variables.css';

/* To this */
@import '/src/styles/ford/_variables.css';
```

### Issue 3: SurveyJS Components Don't Use Ford UI Styling

**Symptoms**: Survey components look generic, not Ford-branded
**Root Cause**: SurveyJS uses default renderers, not Ford UI components
**Solution**: Implement custom renderers in FDSRenderers/

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

## Key Success Factors

1. **CSS Variable Scoping**: Essential for conflict-free brand switching
2. **Absolute Import Paths**: Prevents context-dependent resolution failures  
3. **Automation**: sync-ford-ui.sh eliminates manual errors
4. **Custom Renderers**: Required for SurveyJS + Ford UI integration
5. **Theme Wrapper**: `#fd-nxt` with dynamic class enables automatic inheritance

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

**Important**: This Ford UI integration represents significant lessons learned. The theme-scoped CSS variable architecture and automated sync workflow are critical for maintainable multi-brand design systems. Always prioritize CSS variable scoping and automated tooling to prevent human error.

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