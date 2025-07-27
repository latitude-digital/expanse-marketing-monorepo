# Phase 0 Analysis Report
**Generated**: 2025-07-27  
**Status**: Complete

## Repository Analysis Summary

### Web App (latitude-leads-web)
- **Framework**: React 18.2.0 with Create React App 5.0.1
- **Package Manager**: Yarn 1.22.22 (specified in packageManager field)
- **Node Version**: 20 (.nvmrc)
- **Development Port**: 8001 (configured in .env)
- **Build Tool**: react-scripts

### Firebase (latitude-leads-firebase)  
- **Functions Node Version**: 18 (.nvmrc in functions/)
- **Package Manager**: npm (package-lock.json present)
- **Emulator Ports**: 
  - Functions: 5001
  - Firestore: 8080  
  - Auth: 9099
- **Build Tool**: TypeScript compilation

## Critical Findings

### 🟡 Node Version Conflict
- **Web App**: Node 20
- **Firebase Functions**: Node 18
- **Monorepo**: Node 20 (.nvmrc already set)
- **Resolution**: Firebase functions will need to be updated to Node 20 or we need to document this difference

### 🟢 Package Manager Strategy
- **Web App**: Uses Yarn 1.22.22
- **Firebase**: Uses npm
- **Monorepo Plan**: pnpm (required for Ford UI)
- **Resolution**: All will transition to pnpm - this is acceptable

### 🟢 Port Conflicts - None Detected
- **Web App Dev**: Port 8001
- **Firebase Emulator**: Ports 5001, 8080, 9099  
- **No conflicts expected in monorepo**

### 🟡 Ford UI Current Usage
- **Already Installed**: @ford/ford-ui-components v0.2.54
- **Usage**: Very minimal (1 import found: Button component)
- **Implication**: Migration to new Ford UI architecture should be straightforward

### 🟢 Dependency Analysis
**Shared Dependencies** (potential for workspace optimization):
- react: 18.2.0 (web app)
- moment: 2.29.4 (web) / 2.30.1 (firebase)
- lodash: 4.17.21 (both)
- typescript: Present in both
- firebase: 10.10.0 (web) / firebase-admin 12.6.0 (firebase)

**No major version conflicts detected**

### 🟢 Build Process Compatibility
**Web App Scripts**:
- `start`: react-scripts start
- `build`: react-scripts build + sentry sourcemaps
- Environment-specific builds (production, staging, local)

**Firebase Scripts**:
- `build`: tsc
- `deploy`: firebase deploy --only functions
- `serve`: firebase emulators:start

**Both are workspace-compatible**

## Environment Variables Analysis

### Web App Environment Files
- `.env` (PORT=8001)
- `.env.development`
- `.env.staging` 
- `.env.production`
- `.env.local.example`
- `.env.emulator.local.example`
- `.env.production.local.example`

**Strategy**: All env files can be preserved in packages/web-app/

### Firebase Environment
- No .env files found
- Uses Firebase CLI environment management
- Should work unchanged in monorepo

## Recommendations for Migration

### 1. Node Version Strategy
**Option A** (Recommended): Update Firebase functions to Node 20
- Minimal risk - Node 18→20 is generally compatible
- Maintains consistency across monorepo

**Option B**: Document the difference and manage separately
- More complex but preserves current working state

### 2. Package Manager Transition
- Transition all packages to pnpm
- Create workspace configuration
- Both apps should work fine with pnpm

### 3. Ford UI Integration
- Current Ford UI (v0.2.54) is already present but minimally used
- New Ford UI architecture via submodule will be a future migration
- No immediate conflicts expected

### 4. Special Considerations

#### Meridian Base Dependency
- **Web App**: `meridian-base: latitude-digital/meridian-base#v0.9.0`
- **Firebase**: Git URL with token in package.json
- **Action**: Need to handle private repo access in monorepo context

#### Sentry Integration
- Web app has Sentry sourcemap upload in build process
- Needs to work from monorepo structure
- May need path adjustments

## Migration Risk Assessment

### 🟢 Low Risk
- Port conflicts: None
- Build processes: Both workspace-compatible
- Dependency conflicts: None major
- Environment variables: Well-isolated

### 🟡 Medium Risk  
- Node version alignment (Firebase 18 → 20)
- Package manager transition (yarn/npm → pnpm)
- Private repo access (meridian-base)

### 🔴 High Risk
- None identified

## Validation Tests Needed

1. **pnpm workspace functionality** with both package.json files
2. **Firebase functions on Node 20** compatibility
3. **Sentry sourcemap upload** from monorepo paths
4. **meridian-base access** in pnpm workspace context

## Next Steps

1. Create proof-of-concept pnpm workspace
2. Test Firebase functions Node 20 compatibility
3. Validate build processes in workspace
4. Proceed with Phase 1 migration