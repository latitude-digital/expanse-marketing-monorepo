# Expanse Marketing Monorepo

This monorepo contains the complete Expanse Marketing survey SAAS platform with React web application, Firebase Cloud Functions, and Ford UI v2 components integration.

## Repository Structure

```
packages/
├── web-app/          # React web application (Vite + React 18)
│   ├── src/          # Source code with Ford UI v2 integration
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

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Firebase Cloud Functions + Firestore
- **Design System**: Ford UI v2 + Tailwind CSS
- **Package Management**: pnpm workspaces
- **Build Tools**: Vite (web-app), TypeScript (functions)
- **Authentication**: Firebase Auth + CloudFront signed cookies

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

# Build Ford UI components
cd packages/ford-ui && nx build @ui/ford-ui-components
```

## Development Workflow

### Quick Start

```bash
# Install dependencies (from workspace root)
pnpm install

# Build Ford UI components
cd packages/ford-ui && nx build @ui/ford-ui-components

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

# Ford UI Components
cd packages/ford-ui && nx build @ui/ford-ui-components  # Build components
cd packages/ford-ui && nx run storybook:storybook       # Storybook (port 4400)
```

### Local Development URLs

- **Web App**: http://localhost:8001 (Vite dev server)
- **Admin Dashboard**: http://localhost:8001/admin (requires authentication)
- **Firebase Emulator UI**: http://localhost:4000
- **Functions Emulator**: http://localhost:5001
- **Storybook**: http://localhost:4400

### Production Build

```bash
# Build all packages
pnpm build

# Individual package builds
pnpm --filter @expanse/web-app build        # Web app production build
pnpm --filter @expanse/firebase build       # Compile Firebase functions
cd packages/ford-ui && nx build @ui/ford-ui-components  # Ford UI components
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

# Build and deploy
pnpm firebase:build && pnpm firebase:deploy  # Build functions then deploy
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

### Firebase Project Setup

```bash
# Login to Firebase
firebase login

# Set project
firebase use expanse-marketing              # Production
firebase use expanse-marketing-staging     # Staging

# Initialize hosting (if needed)
firebase init hosting

# Test deployment with emulator
pnpm firebase:emulators
```

## Ford UI Component Usage

### Component Import Patterns by Category

#### Foundation Components (Atoms)

Basic building blocks - simple, single-purpose components.

```typescript
// Button component
import { StyledButton, UnstyledButton } from '@ui/ford-ui-components/v2/button/Button';
// OR using path alias
import { StyledButton } from '@ford-ui/button/Button';

// Icon component  
import { Icon } from '@ford-ui/icon/Icon';

// Typography
import { Typography } from '@ford-ui/typography/Typography';

// Input field
import { Input } from '@ford-ui/inputField/Input';

// Checkbox
import { Checkbox, UnstyledCheckbox } from '@ford-ui/checkbox';

// Radio buttons
import { RadioButton, RadioButtonGroup } from '@ford-ui/radio';

// Toggle switch
import { Toggle, UnstyledToggle } from '@ford-ui/toggle';

// Usage example
export default function LoginForm() {
  return (
    <form className="space-y-4">
      <Input 
        label="Email" 
        type="email" 
        placeholder="Enter your email"
      />
      <Input 
        label="Password" 
        type="password" 
        placeholder="Enter your password"
      />
      <Checkbox label="Remember me" />
      <StyledButton variant="primary" type="submit">
        Sign In
      </StyledButton>
    </form>
  );
}
```

#### Interface Components (Molecules)

Components that combine atoms into functional units.

```typescript
// Search component
import { Search, UnstyledSearch } from '@ford-ui/search/Search';

// Notification
import { Notification, UnstyledNotification } from '@ford-ui/notification';

// Notification Dot
import { NotificationDot, UnstyledNotificationDot } from '@ford-ui/notificationDot';

// Rating component
import { Rating, UnstyledRating } from '@ford-ui/rating';

// Chip components
import { Chip, UnstyledChip, ChipGroup } from '@ford-ui/chip';

// Breadcrumbs
import { Breadcrumbs, UnstyledBreadcrumbs } from '@ford-ui/breadcrumbs';
```

#### Layout Components (Organisms)

Complex components that form distinct sections of an interface.

```typescript
// Modal component
import { Modal } from '@ford-ui/modal';

// Drawer/Sheet component
import { Drawer, Sheet } from '@ford-ui/drawer';

// Popover component
import { Popover } from '@ford-ui/popover';

// Data Table
import { StyledDataTable as DataTable } from '@ford-ui/dataTable/DataTable.styled';

// Tabs component
import { Tabs } from '@ford-ui/tabs';

// Pagination
import { Pagination, UnstyledPagination } from '@ford-ui/pagination';

// Selection Cards
import { StyledSelectionCard as SelectionCard } from '@ford-ui/selection-card/default/StyledSelectionCard';
import { StyledSelectionCardSmall as SelectionCardSmall } from '@ford-ui/selection-card/small/styled/StyledSelectionCardSmall';
```

#### Specialized Components (Templates)

Domain-specific components for Ford's e-commerce use cases.

```typescript
// Vehicle Cards
import { StyledVehicleCard as VehicleCard } from '@ford-ui/vehicleCard/styled/StyledVehicleCard';
import { UnstyledVehicleCard } from '@ford-ui/vehicleCard/unstyled/UnstyledVehicleCard';

// Editorial Cards
import { StyledEditorialCard as EditorialCard } from '@ford-ui/editorialCard/styled/StyledEditorialCard';

// List components
import { List, UnstyledList } from '@ford-ui/list/listItem';
import { ListGroup } from '@ford-ui/list/listItemGroup';

// Floating Action Button
import { FloatingActionButton } from '@ford-ui/floatingActionButton/FloatingActionButton';
```

### Design System Integration

#### Theme Application

Ford UI v2 uses CSS custom properties for theming. Apply themes at the app level:

```typescript
// Apply theme to your app
export default function App({ children }) {
  return (
    <html lang="en" className="ford_light"> {/* or ford_dark */}
      <body>
        <div className="min-h-screen bg-background-onlight-default text-text-onlight-default">
          {children}
        </div>
      </body>
    </html>
  );
}
```

#### Design Tokens Usage

```typescript
// Use semantic tokens directly in your components
export default function CustomComponent() {
  return (
    <div className="bg-surface-onlight-default border border-border-onlight-default p-4 rounded-lg">
      <h2 className="text-text-onlight-strong text-lg font-semibold mb-2">
        Custom Component
      </h2>
      <p className="text-text-onlight-subtle">
        This component uses Ford's semantic design tokens.
      </p>
    </div>
  );
}
```

## Component Discovery Workflow

1. **Browse Storybook**: Visit http://localhost:4400 to see all available components
2. **Find Component**: Navigate to the component category in Storybook
3. **Check Implementation**: View the "Docs" tab for props and examples
4. **Import in App**: Use the import patterns shown above
5. **Verify Styling**: Ensure Tailwind config includes Ford UI's design tokens

### Storybook Categories Mapping

| Storybook Category | Component Examples | Import Pattern |
|-------------------|-------------------|----------------|
| **Foundation Components** | Button, Input, Icon, Typography | `@ford-ui/[component]/[Component]` |
| **Interface Components** | Search, Notification, Rating, Chips | `@ford-ui/[component]` |
| **Layout Components** | Modal, Drawer, DataTable, Tabs | `@ford-ui/[component]` |
| **Specialized Components** | VehicleCard, EditorialCard, Lists | `@ford-ui/[component]/styled/[Component]` |

## Version Management

### Updating Ford UI Components

```bash
# Update to latest Ford UI changes
cd packages/ford-ui
git pull origin develop

# Return to workspace root and commit the update
cd ../..
git add packages/ford-ui
git commit -m "Update Ford UI components to latest develop"
```

### Checking Current Version

```bash
# See current Ford UI version
cd packages/ford-ui
git log --oneline -5        # Recent commits
git describe --tags         # Current tag if available
git rev-parse --short HEAD  # Current commit hash
```

### Rolling Back Updates

```bash
# If an update breaks something, rollback to previous version
cd packages/ford-ui
git checkout [previous-commit-hash]
cd ../..
git add packages/ford-ui
git commit -m "Rollback Ford UI to stable version"
```

## Troubleshooting

### Common Issues

**1. Tailwind Styles Not Applied**
```javascript
// Ensure Ford UI paths are included in Tailwind content
content: [
  './src/**/*.{js,ts,jsx,tsx}',
  '../ford-ui/packages/@ui/ford-ui-components/src/**/*.{js,ts,jsx,tsx}' // Add this
]
```

**2. TypeScript Import Errors**
```json
// Add proper path mapping in tsconfig.json
"paths": {
  "@ui/ford-ui-components": ["../ford-ui/packages/@ui/ford-ui-components/src"]
}
```

**3. Design Tokens Not Resolving**
```javascript
// Verify Tailwind preset is properly configured
presets: [
  require('../ford-ui/packages/@ui/ford-ui-components/tailwind.config.js')
]
```

**4. Hot Reload Not Working**
- Ensure workspace dependencies are properly linked
- Restart dev server after Ford UI changes
- Check that file watchers include Ford UI source files

**5. Submodule Issues**
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

## Critical Considerations

### Dependencies Synchronization
- Ensure React versions match between Ford UI and web app
- Verify react-aria-components versions are compatible
- Keep Tailwind CSS configurations aligned

### Design Token Resolution
- Ford UI's semantic tokens must be properly inherited
- Test both light and dark themes
- Verify responsive design tokens work correctly

### Build Performance
- Ford UI components are pre-built, minimizing build time
- pnpm workspace provides efficient dependency management and caching
- Monitor bundle size impact of included components

## Getting Help

1. **Storybook Documentation**: Reference component APIs and examples
2. **Ford UI Repository**: Check component source code and tests
3. **Workspace Documentation**: Review pnpm workspace guides
4. **Design System Team**: Consult with Ford UI maintainers for complex issues

---

For migration details and implementation plans, see [MIGRATION_PLAN.md](./MIGRATION_PLAN.md).