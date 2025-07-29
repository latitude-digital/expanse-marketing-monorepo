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
pnpm dev:all  # Starts web-app + Firebase emulator
```

### Development Commands

```bash
# Web Application Development
pnpm --filter @expanse/web-app dev          # Start Vite dev server (port 8001)
pnpm --filter @expanse/web-app build        # Build for production
pnpm --filter @expanse/web-app preview      # Preview production build

# Firebase Functions Development  
pnpm --filter @expanse/firebase build       # Compile TypeScript functions
pnpm --filter @expanse/firebase serve       # Start Firebase emulator
pnpm firebase:emulators                     # Start all Firebase emulators

# Full-stack Development
pnpm dev                                     # Start all packages
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
- **Firebase Emulator UI**: http://localhost:4000
- **Functions Emulator**: http://localhost:5001
- **Storybook**: http://localhost:4400

## Ford Design System Integration

### Three-Way Brand Switching Architecture

Our implementation supports seamless switching between Ford, Lincoln, and Unbranded themes:

```typescript
// Brand switching implementation in Survey.jsx
const [currentBrand, setCurrentBrand] = useState('ford'); // 'ford', 'lincoln', or 'unbranded'

// Theme application with proper CSS variable scoping
<div id="fd-nxt" className={
    currentBrand === 'ford' ? 'ford_light' : 
    currentBrand === 'lincoln' ? 'lincoln_light' : 
    'unbranded'
}>
```

### Theme-Scoped CSS Variables

**Critical Learning**: CSS variables must be theme-scoped to prevent conflicts between brands.

```css
/* ❌ WRONG: Global scope causes brand conflicts */
:root {
  --semantic-color-text-onlight-moderate-default: #333333;
}

/* ✅ CORRECT: Theme-scoped variables enable proper switching */
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

### Ford UI CSS Import Strategy

**Critical Learning**: Use absolute paths to prevent context-dependent resolution issues.

```scss
/* ❌ WRONG: Relative paths fail when imported from subdirectories */
@import './styles/ford/_variables.css';

/* ✅ CORRECT: Absolute paths work from any import context */
@import '/src/styles/ford/_variables.css';
@import '/src/styles/lincoln/_variables.css';
```

### Automated CSS Sync Script

The `sync-ford-ui.sh` script automatically handles theme scoping transformations:

```bash
# Run the comprehensive Ford UI update command
pnpm ford-ui:update

# What it does:
# 1. Initializes/updates Ford UI submodule to latest version
# 2. Builds Ford UI components with nx
# 3. Copies CSS files from Ford UI to web-app
# 4. Transforms :root selectors to theme-scoped classes
# 5. Applies sed transformations: :root { → .ford_light { and .lincoln_light {
# 6. Ensures proper theme switching without CSS variable conflicts
```

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

## Brand Theme Implementation

### Ford Theme Features
- **Colors**: Ford blue primary palette (#0066cc, #044ea7)
- **Typography**: FordF1 font family
- **Components**: Ford-specific visual styling
- **Radius**: Rounded corners (400px for buttons)

### Lincoln Theme Features  
- **Colors**: Lincoln burgundy palette (#8B2635, #22292b)
- **Typography**: LincolnSerif and LincolnFont families
- **Components**: Luxury-focused visual styling
- **Radius**: Sharp, angular design (4px for buttons)

### Unbranded Theme Features
- **Colors**: Neutral grays (#333333, #666666, #cccccc)
- **Typography**: System fonts (-apple-system, BlinkMacSystemFont, Roboto)
- **Components**: Clean, minimal styling
- **Radius**: Standard web conventions (4px)

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

# Individual package builds
pnpm --filter @expanse/web-app build        # Web app production build
pnpm --filter @expanse/firebase build       # Compile Firebase functions
pnpm ford-ui:update                          # Ford UI components + CSS sync

# Build with Ford UI update
pnpm ford-ui:update && pnpm build
```

## Deployment

### Firebase Deployment

```bash
# Deploy everything (functions + hosting)
pnpm deploy:production

# Deploy specific services
pnpm firebase:deploy:functions               # Functions only
pnpm firebase:deploy:hosting                 # Hosting only
pnpm firebase:deploy                         # Both functions and hosting

# Build and deploy with Ford UI update
pnpm ford-ui:update && pnpm firebase:build && pnpm firebase:deploy
```

### Environment Configuration

Create environment files in `packages/web-app/`:

```bash
# .env.local (local development)
VITE_ENV=local
VITE_FIREBASE_PROJECT_ID=expanse-marketing-dev

# .env.staging (staging environment) 
VITE_ENV=staging
VITE_FIREBASE_PROJECT_ID=expanse-marketing-staging

# .env.production (production environment)
VITE_ENV=production 
VITE_FIREBASE_PROJECT_ID=expanse-marketing
```

## Troubleshooting Ford UI Integration

### CSS Import Resolution Issues

**Problem**: CSS imports fail when BroncoQuiz.scss imports ../index.scss
**Solution**: Use absolute paths in index.scss

```scss
/* ❌ WRONG: Context-dependent relative paths */
@import './styles/ford/_variables.css';

/* ✅ CORRECT: Absolute paths from project root */
@import '/src/styles/ford/_variables.css';
```

### Brand Switching Not Working

**Problem**: Brand switching changes classes but not visual styling
**Root Cause**: CSS variables defined at `:root` level override each other
**Solution**: Theme-scoped CSS variables

```scss
/* ❌ WRONG: Global variables conflict */
:root {
  --semantic-color-text-onlight-moderate-default: #333333;
}

/* ✅ CORRECT: Scoped variables enable switching */
.ford_light {
  --semantic-color-text-onlight-moderate-default: #333333;
}
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

### 1. CSS Variable Scoping is Essential
- **Problem**: Global `:root` variables cause brand conflicts
- **Solution**: Theme-scoped variables (`.ford_light`, `.lincoln_light`, `.unbranded`)
- **Implementation**: Automated sed transformations in sync script

### 2. Import Path Resolution Context Matters
- **Problem**: Relative paths fail in nested import contexts
- **Solution**: Absolute paths from project root
- **Critical**: CSS imports must be context-independent

### 3. SurveyJS Integration Requires Custom Renderers
- **Problem**: SurveyJS default components don't use Ford UI styling
- **Solution**: Custom ReactQuestionFactory renderers
- **Bridge**: CSS classes connect SurveyJS expectations to Ford UI

### 4. Theme Switching Needs Proper Component Architecture
- **Pattern**: Single theme state controls entire application
- **Wrapper**: `#fd-nxt` wrapper element with dynamic theme class
- **Inheritance**: CSS variables cascade to all child components

### 5. Automation Prevents Human Error
- **Tool**: `pnpm ford-ui:update` command handles complex transformations
- **Benefits**: Eliminates manual CSS variable scoping errors
- **Process**: Submodule update → CSS copy → Theme scoping → Ready for development

## Getting Help

1. **Storybook Documentation**: Reference component APIs and examples at http://localhost:4400
2. **Ford UI Repository**: Check component source code and tests
3. **Brand Switching**: Test all three themes in Survey component
4. **CSS Debugging**: Use browser DevTools to inspect CSS variable inheritance
5. **Ford UI Update**: Run `pnpm ford-ui:update` when CSS issues occur

---

**Next Steps**: This implementation provides a solid foundation for Ford Design System integration with advanced brand switching capabilities. The theme-scoped CSS architecture supports future brand additions and ensures maintainable, conflict-free styling.