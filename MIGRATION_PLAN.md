# Expanse Marketing Monorepo Migration Plan

## Overview
This document outlines the step-by-step migration of latitude-digital/latitude-leads-web and latitude-digital/latitude-leads-firebase into the expanse-marketing-monorepo, with preparation for Ford UI Components integration.

**Status**: Planning Complete, Phase 0 In Progress  
**Last Updated**: 2025-07-27

## Migration Phases

### Phase 0: Repository Analysis & Validation ⭐ CRITICAL
**Status**: ✅ COMPLETE

#### Objectives
- Analyze existing repository structures and dependencies
- Identify potential conflicts and compatibility issues
- Create proof-of-concept monorepo locally
- Validate approach before production migration

#### Tasks
- [x] Clone latitude-leads-web for analysis
- [x] Clone latitude-leads-firebase for analysis
- [x] Analyze package.json files and dependencies
- [x] Check Node.js version compatibility (.nvmrc)
- [x] Identify dependency conflicts (React, Firebase SDKs, etc.)
- [x] Document build processes and scripts
- [x] Check for port conflicts in development
- [x] Analyze environment variable patterns
- [x] Create comprehensive analysis report
- [x] Create proof-of-concept monorepo structure
- [x] Test pnpm workspace functionality
- [x] Document findings and update plan

#### Key Findings (See PHASE0_ANALYSIS.md for details)
- **🟡 Node Version Conflict**: Web app (Node 20) vs Firebase functions (Node 18)
- **🟢 No Port Conflicts**: Web app (8001), Firebase emulators (5001,8080,9099)
- **🟢 Package Manager Transition**: yarn/npm → pnpm is feasible
- **🟢 Minimal Ford UI Usage**: Only 1 component import, easy to migrate
- **🟡 Private Repo Dependency**: meridian-base needs workspace configuration
- **🟢 Build Compatibility**: Both apps work well in workspace setup

#### Success Criteria
- ✅ Complete understanding of both repository structures
- ✅ Identified and documented all potential conflicts  
- ✅ Validated pnpm workspace compatibility
- ✅ Proof-of-concept monorepo functions correctly

---

### Phase 1: Monorepo Foundation Setup
**Status**: ✅ COMPLETE

#### Objectives
- Create pnpm workspace configuration per Ford UI requirements
- Add Ford UI as git submodule
- Establish proper directory structure for Ford UI integration
- Set up team onboarding procedures

#### Tasks

**1A: Workspace Foundation**
- [x] Install pnpm globally (if not present)
- [x] Create pnpm-workspace.yaml with Ford UI structure:
  ```yaml
  packages:
    - "packages/*"
  ```
- [x] Set up root package.json with workspace scripts
- [x] Create packages/ directory structure
- [x] Configure comprehensive .gitignore

**1B: Ford UI Submodule Setup** ⭐ **FROM use-as-is.md**
- [x] Add Ford UI as git submodule:
  ```bash
  git submodule add git@github.ford.com:eComm360-Foundational-Service/web-app.git packages/ford-ui
  ```
- [x] Navigate to submodule and checkout develop branch
- [x] Commit submodule configuration
- [x] Update .gitmodules for team collaboration
- [x] Test submodule initialization process

**1C: Team Onboarding Setup** ⭐ **FROM use-as-is.md**
- [x] Document git clone with submodules process:
  ```bash
  git clone --recursive [repo-url]
  # OR
  git submodule update --init --recursive
  ```
- [x] Create team setup instructions
- [x] Test workspace functionality with Ford UI submodule

#### Success Criteria
- ✅ pnpm workspace commands function correctly
- ✅ Ford UI submodule properly configured and accessible
- ✅ Team members can clone and initialize submodules
- ✅ Foundation ready for application migration with Ford UI integration

---

### Phase 2: Web App Migration (latitude-leads-web → packages/web-app)
**Status**: ⏳ Pending Previous Phases

#### Objectives
- **Clean up unused dependencies** before migration (15-25MB reduction)
- Migrate web application with zero functionality changes
- **Replace Create React App with Vite** for modern build tooling
- Maintain all existing build processes and deployment model
- Preserve development workflow

#### Tasks

**2A: Dependency Cleanup** ⭐ **NEW - PERFORMANCE CRITICAL**
- [ ] **Phase 1 - Safe Kendo Removals**: Remove 31 unused Kendo packages:
  ```bash
  # Remove unused Kendo React components
  yarn remove @progress/kendo-react-animation @progress/kendo-react-charts \
              @progress/kendo-react-conversational-ui @progress/kendo-react-data-tools \
              @progress/kendo-react-dropdowns @progress/kendo-react-editor \
              @progress/kendo-react-excel-export @progress/kendo-react-gantt \
              @progress/kendo-react-gauges @progress/kendo-react-grid \
              @progress/kendo-react-intl @progress/kendo-react-listbox \
              @progress/kendo-react-notification @progress/kendo-react-pdf \
              @progress/kendo-react-pivotgrid @progress/kendo-react-popup \
              @progress/kendo-react-progressbars @progress/kendo-react-ripple \
              @progress/kendo-react-scheduler @progress/kendo-react-sortable \
              @progress/kendo-react-tooltip @progress/kendo-react-treelist \
              @progress/kendo-react-treeview @progress/kendo-react-upload \
              @progress/kendo-theme-default
  
  # Remove unused Kendo core packages  
  yarn remove @progress/kendo-data-query @progress/kendo-date-math \
              @progress/kendo-drawing @progress/kendo-intl \
              @progress/kendo-popup-common
  
  # Remove accidental dependency
  yarn remove add
  ```
- [ ] **Build Test**: Verify application builds successfully
- [ ] **Runtime Test**: Test major user flows (login, survey creation, data export)
- [ ] **Phase 2 - Verification**: Check usage of inputmask, showdown, sprintf-js, ua-parser-js
- [ ] **Remove verified unused packages** from Phase 2
- [ ] **Bundle Analysis**: Verify 15-25MB reduction achieved
- [ ] **Git Commit**: Dependency cleanup complete

**2B: Git History-Preserving Migration** ⭐ **PRESERVE HISTORY**
- [ ] Add latitude-leads-web as remote:
  ```bash
  git remote add web-app-origin https://github.com/latitude-digital/latitude-leads-web.git
  git fetch web-app-origin
  ```
- [ ] Use git subtree to merge with history preservation:
  ```bash
  git subtree add --prefix=packages/web-app web-app-origin main --squash
  ```
  OR use git filter-branch approach:
  ```bash
  # Create temporary branch for web app
  git checkout -b migrate-web-app web-app-origin/main
  # Move all files to packages/web-app/ subdirectory
  git filter-branch --tree-filter 'mkdir -p packages/web-app && git ls-tree --name-only HEAD | grep -v packages | xargs -I{} mv {} packages/web-app/' HEAD
  # Merge back to main
  git checkout main
  git merge migrate-web-app --allow-unrelated-histories
  ```
- [ ] Update package.json name for workspace
- [ ] Preserve all existing dependencies and versions  
- [ ] Update internal path references for monorepo
- [ ] Ensure .env files work in new location
- [ ] Verify git log shows complete history in packages/web-app/

**2B: Vite Migration** ⭐ **NEW REQUIREMENT**
- [ ] Remove react-scripts dependency
- [ ] Install Vite and @vitejs/plugin-react
- [ ] Create vite.config.ts with React and Tailwind plugins
- [ ] Move index.html to project root (Vite requirement)
- [ ] Update index.html script references for Vite
- [ ] Configure environment variable handling (REACT_APP_ → VITE_)
- [ ] Update package.json scripts (start, build, test)
- [ ] Configure Sentry source map upload for Vite build output
- [ ] Test Vite development server functionality
- [ ] Verify Vite build produces static files (no server required)

**2C: Ford UI Integration** ⭐ **FROM use-as-is.md**
- [ ] Add Ford UI workspace dependency to package.json:
  ```json
  "dependencies": {
    "@ui/ford-ui-components": "workspace:*",
    "react-aria-components": "^1.0.0",
    "tailwind-variants": "^0.1.0"
  }
  ```
- [ ] Configure Tailwind CSS with Ford UI presets:
  ```javascript
  module.exports = {
    presets: [
      require('../ford-ui/packages/@ui/ford-ui-components/tailwind.config.js')
    ],
    content: [
      './src/**/*.{js,ts,jsx,tsx}',
      '../ford-ui/packages/@ui/ford-ui-components/src/**/*.{js,ts,jsx,tsx}'
    ]
  }
  ```
- [ ] Configure TypeScript path mappings for Ford UI:
  ```json
  "paths": {
    "@ford-ui/*": ["../ford-ui/packages/@ui/ford-ui-components/src/v2/*"],
    "@ford-ui/icons": ["../ford-ui/packages/@ui/ford-ui-components/src/v2/ford-icons"],
    "@ui/ford-ui-components": ["../ford-ui/packages/@ui/ford-ui-components/src"]
  }
  ```
- [ ] Build Ford UI components: `cd packages/ford-ui && nx build @ui/ford-ui-components`

**2D: Integration & Testing**
- [ ] Install dependencies via pnpm workspace
- [ ] Test development server functionality
- [ ] Verify build process produces identical static output
- [ ] Test all major user flows
- [ ] Confirm environment variables load correctly
- [ ] Validate Ford UI components work with Vite and new import patterns
- [ ] Test Tailwind CSS compilation with Ford UI presets
- [ ] Verify external script loading (Google Maps, jsPDF, etc.)
- [ ] Test Ford UI component imports using documented patterns
- [ ] Create git commit after successful migration

#### Success Criteria
- **15-25MB bundle size reduction** from dependency cleanup
- **20-30% faster install times** from removing unused packages
- Web app runs identically to original
- All existing functionality preserved
- **Static build output** maintained (no server required)
- **Significantly faster development builds** (10-20x improvement)
- Build and development processes work unchanged
- No breaking changes introduced

#### Vite Configuration Requirements
```typescript
// vite.config.ts structure needed
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build', // maintain CRA output structure
    sourcemap: true  // for Sentry integration
  },
  define: {
    // Handle environment variables compatibility
  }
})
```

---

### Phase 3: Firebase Migration (latitude-leads-firebase → packages/firebase)
**Status**: ⏳ Pending Previous Phases

#### Objectives
- Migrate Firebase backend with preserved deployment
- Maintain existing Cloud Functions structure
- Ensure API compatibility

#### Tasks

**3A: Git History-Preserving Migration** ⭐ **PRESERVE HISTORY**
- [ ] Add latitude-leads-firebase as remote:
  ```bash
  git remote add firebase-origin https://github.com/latitude-digital/latitude-leads-firebase.git
  git fetch firebase-origin
  ```
- [ ] Use git subtree to merge with history preservation:
  ```bash
  git subtree add --prefix=packages/firebase firebase-origin main --squash
  ```
  OR use git filter-branch approach:
  ```bash
  # Create temporary branch for firebase
  git checkout -b migrate-firebase firebase-origin/main
  # Move all files to packages/firebase/ subdirectory
  git filter-branch --tree-filter 'mkdir -p packages/firebase && git ls-tree --name-only HEAD | grep -v packages | xargs -I{} mv {} packages/firebase/' HEAD
  # Merge back to main
  git checkout main
  git merge migrate-firebase --allow-unrelated-histories
  ```
- [ ] Verify git log shows complete history in packages/firebase/

**3B: Firebase Configuration**
- [ ] Update firebase.json paths for monorepo context
- [ ] Preserve environment variable patterns
- [ ] Add Firebase CLI scripts to root package.json for convenience
- [ ] Ensure pnpm workspace handles Firebase functions dependencies

**3C: Testing & Validation**
- [ ] Test Firebase emulator functionality
- [ ] Verify Cloud Functions deployment process
- [ ] Test all API endpoints respond correctly
- [ ] Confirm database connections work unchanged
- [ ] Validate authentication flows
- [ ] Create git commit after successful migration

#### Success Criteria
- Firebase functions deploy successfully
- All API endpoints function identically
- Development and production environments work
- No service interruptions

---

### Phase 4: Final Validation & Documentation
**Status**: ⏳ Pending Previous Phases

#### Objectives
- Validate complete monorepo functionality
- Update comprehensive documentation
- Ensure team onboarding procedures work

#### Tasks
- [ ] End-to-end testing of all packages in monorepo
- [ ] Verify Ford UI component import patterns work correctly
- [ ] Test complete development workflow (clone → setup → dev → build)
- [ ] Update CLAUDE.md with monorepo structure and commands
- [ ] Document Ford UI component usage patterns per use-as-is.md
- [ ] Create team onboarding checklist
- [ ] Test git submodule workflow for new team members
- [ ] Validate CI/CD adaptation requirements
- [ ] Document environment variable strategy
- [ ] Create troubleshooting guide for common issues

#### Success Criteria
- Complete monorepo functions end-to-end
- Ford UI components accessible and usable
- Team can onboard using documented procedures
- All development workflows validated

---

## Final Validation & Documentation
**Status**: ⏳ Pending All Phases

### Tasks
- [ ] End-to-end testing of all packages
- [ ] Update CLAUDE.md with monorepo structure
- [ ] Document development workflows
- [ ] Create team onboarding instructions
- [ ] Document CI/CD adaptation requirements
- [ ] Finalize environment variable strategy

---

## Risk Mitigation

### Identified Risks
1. **Dependency Conflicts**: Different package versions between apps
2. **Vite Migration**: Build tooling changes from react-scripts to Vite
3. **Environment Variables**: REACT_APP_ → VITE_ prefix changes + path changes
4. **CI/CD Pipeline**: Existing deployments will need updates
5. **Port Conflicts**: Development servers may conflict
6. **Sentry Integration**: Source map upload paths may need adjustment

### Mitigation Strategies
- Comprehensive Phase 0 analysis before changes
- **Parallel builds**: Keep CRA working during Vite migration
- **Environment variable compatibility layer** in Vite config
- Git commits after each successful phase
- Keep original repositories as backup
- Test thoroughly before proceeding to next phase
- Document all issues and deviations

---

## Git History Preservation Strategy

### **Why Preserve History**
- **Code Authorship**: Maintain git blame for debugging and context
- **Audit Trail**: Preserve complete development timeline
- **Knowledge Transfer**: Keep commit messages and context for future developers
- **Compliance**: Maintain legal and regulatory audit trails

### **Migration Techniques**
1. **git subtree** (Recommended): Cleanest merge with preserved history
   - Merges entire repository as subdirectory
   - Maintains linear history in monorepo
   - Easy to understand and maintain

2. **git filter-branch**: More control but complex
   - Rewrites history to relocate files
   - Useful for complex directory restructuring
   - Requires careful handling

### **Verification Commands**
```bash
# Verify history preservation after migration
git log --oneline packages/web-app/    # Should show original commits
git log --oneline packages/firebase/   # Should show original commits
git blame packages/web-app/src/index.tsx  # Should show original authors
```

## Key Principles

1. **"Use-As-Is"**: No modifications beyond monorepo integration
2. **Zero Downtime**: Applications must function identically
3. **Phased Approach**: Complete each phase before proceeding
4. **Evidence-Based**: All decisions informed by actual repository analysis
5. **History Preservation**: Maintain complete git history from original repositories
6. **Rollback Ready**: Git commits enable reverting changes

---

## Ford UI Component Import Patterns (from use-as-is.md)

### Foundation Components (Atoms)
```typescript
// Button component
import { StyledButton, UnstyledButton } from '@ui/ford-ui-components/v2/button/Button';
// OR using path alias
import { StyledButton } from '@ford-ui/button/Button';

// Input field
import { Input } from '@ford-ui/inputField/Input';
```

### Interface Components (Molecules)
```typescript
// Search component
import { Search, UnstyledSearch } from '@ford-ui/search/Search';

// Notification
import { Notification, UnstyledNotification } from '@ford-ui/notification';
```

### Layout Components (Organisms)
```typescript
// Modal component
import { Modal } from '@ford-ui/modal';

// Data Table
import { StyledDataTable as DataTable } from '@ford-ui/dataTable/DataTable.styled';
```

## Notes
- This plan leverages direct gh CLI access to latitude-digital repositories
- Expert consensus strongly supports Phase 0 analysis approach
- **Ford UI integration fully incorporated** based on use-as-is.md requirements
- **Dependency cleanup analysis** documented in DEPENDENCY_CLEANUP_ANALYSIS.md
- Focus on tooling challenges (CI/CD, env vars) while following Ford UI patterns
- Team onboarding includes git submodule workflows