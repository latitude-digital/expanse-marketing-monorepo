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

[... rest of existing content remains unchanged ...]

## Critical Firebase Patterns - MUST READ

### Firebase Function Naming and Database Selection

**IMPORTANT**: Firebase functions are deployed with environment-specific prefixes but ALL functions must properly handle database selection:

1. **Frontend Function Calls**:
   - NEVER hardcode "staging-" or "prod-" prefixes in frontend code
   - ALWAYS use the `getFirebaseFunctionName()` utility from `utils/getFirebaseFunctionPrefix.ts`
   - Example:
     ```typescript
     // WRONG - Hardcoded prefix
     const myFunction = httpsCallable(functions, 'staging-myFunction');
     
     // CORRECT - Dynamic prefix based on environment
     import { getFirebaseFunctionName } from '../../utils/getFirebaseFunctionPrefix';
     const myFunction = httpsCallable(functions, getFirebaseFunctionName('myFunction'));
     ```

2. **Backend Database Selection**:
   - Firebase functions MUST accept a `database` parameter to select the correct Firestore database
   - The database parameter should be passed when creating function instances in `index.ts`
   - Example pattern:
     ```typescript
     // In your function implementation
     export const myFunctionImpl = (app: admin.app.App, database: string = "(default)") => 
       onCall({ cors: true }, async (request) => {
         const db = getFirestoreDb(app, database);
         // ... use db for all Firestore operations
       });
     
     // In index.ts
     const myFunctionStaging = myFunctionImpl(app, "staging");
     const myFunctionProd = myFunctionImpl(app, "(default)");
     
     export const staging = {
       myFunction: myFunctionStaging,
       // ...
     };
     
     export const prod = {
       myFunction: myFunctionProd,
       // ...
     };
     ```

3. **Environment Detection**:
   - Production: `survey.expansemarketing.com` → uses `prod-` prefix and "(default)" database
   - Staging: `survey.staging.expansemarketing.com` → uses `staging-` prefix and "staging" database
   - Local development: defaults to staging

4. **Common Mistakes to Avoid**:
   - ❌ Using `process.env.DB_NAME` alone to determine database (doesn't work with namespace exports)
   - ❌ Hardcoding function prefixes in frontend code
   - ❌ Forgetting to create separate staging/prod instances in index.ts
   - ❌ Not passing the database parameter through to Firestore operations

## Memories

- The firebase project name is latitude-lead-system