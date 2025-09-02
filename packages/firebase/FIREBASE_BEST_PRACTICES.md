# Firebase Functions Best Practices

## Critical: Database Selection Pattern

### The Problem
Firebase functions are deployed with namespace prefixes (`staging-` and `prod-`) but the functions themselves need to know which Firestore database to use. Using `process.env.DB_NAME` doesn't work because both staging and production functions run in the same environment.

### The Solution
Every Firebase function that accesses Firestore MUST:

1. **Accept a `database` parameter** in its implementation
2. **Use `getFirestoreDatabase` utility** from `utils/getFirestoreDatabase.ts`
3. **Create separate instances** for staging and production in `index.ts`

### Implementation Pattern

#### Step 1: Function Implementation
```typescript
// ✅ CORRECT - Function accepts database parameter
import { getFirestoreDatabase } from './utils/getFirestoreDatabase';

export const myFunctionImpl = (
  app: admin.app.App, 
  database: string = "(default)"
) => 
  onCall({ cors: true }, async (request) => {
    // Use the database parameter to get correct Firestore instance
    const db = getFirestoreDatabase(app, database);
    
    // Now use db for all Firestore operations
    const result = await db.collection('myCollection').get();
    // ...
  });

// ❌ WRONG - Using process.env.DB_NAME
export const myFunctionImpl = (app: admin.app.App) => 
  onCall({ cors: true }, async (request) => {
    // This will always use the same database regardless of namespace
    const database = process.env.DB_NAME || "(default)";
    const db = getFirestore(app, database);
    // ...
  });
```

#### Step 2: Creating Instances in index.ts
```typescript
// ✅ CORRECT - Create separate instances with explicit database
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

// ❌ WRONG - Single instance relying on environment variable
const myFunction = myFunctionImpl(app);

export const staging = {
  myFunction,  // Will use wrong database!
  // ...
};
```

## Frontend Function Calls

### The Problem
Hardcoding function prefixes like `staging-` or `prod-` in frontend code means the app will always call the wrong functions in different environments.

### The Solution
Always use the `getFirebaseFunctionName` utility to dynamically determine the correct prefix based on the current environment.

### Implementation Pattern

```typescript
// ✅ CORRECT - Dynamic prefix based on environment
import { getFirebaseFunctionName } from '../../utils/getFirebaseFunctionPrefix';

const myFunction = httpsCallable(
  functions, 
  getFirebaseFunctionName('myFunction')
);

// ❌ WRONG - Hardcoded prefix
const myFunction = httpsCallable(functions, 'staging-myFunction');
```

### Environment Detection Logic
```typescript
// utils/getFirebaseFunctionPrefix.ts
export function getFirebaseFunctionPrefix(): string {
  const hostname = window.location.hostname;
  
  if (hostname === 'survey.expansemarketing.com') {
    return 'prod-';
  }
  
  if (hostname === 'survey.staging.expansemarketing.com') {
    return 'staging-';
  }
  
  // Local development defaults to staging
  return 'staging-';
}
```

## Database Architecture

- **Production**: Uses `(default)` database
- **Staging**: Uses `staging` database
- **Local/Emulator**: Uses default database with emulator

## Common Pitfalls to Avoid

### 1. Forgetting Database Parameter
```typescript
// ❌ WRONG - No database parameter
export const myFunctionImpl = (app: admin.app.App) => ...

// ✅ CORRECT - Includes database parameter
export const myFunctionImpl = (
  app: admin.app.App, 
  database: string = "(default)"
) => ...
```

### 2. Using Legacy getFirestore
```typescript
// ❌ WRONG - Using old getFirestore function
const db = getFirestore(app);

// ✅ CORRECT - Using getFirestoreDatabase with database parameter
const db = getFirestoreDatabase(app, database);
```

### 3. Not Creating Separate Instances
```typescript
// ❌ WRONG - Reusing same instance for both environments
const myFunction = myFunctionImpl(app);

// ✅ CORRECT - Separate instances with explicit database
const myFunctionStaging = myFunctionImpl(app, "staging");
const myFunctionProd = myFunctionImpl(app, "(default)");
```

### 4. Hardcoding Environment in Frontend
```typescript
// ❌ WRONG - Will break in production
const func = httpsCallable(functions, 'staging-myFunction');

// ✅ CORRECT - Adapts to environment
const func = httpsCallable(functions, getFirebaseFunctionName('myFunction'));
```

## Checklist for New Functions

When creating a new Firebase function that uses Firestore:

- [ ] Add `database: string = "(default)"` parameter to function signature
- [ ] Import and use `getFirestoreDatabase` from `utils/getFirestoreDatabase.ts`
- [ ] Create separate staging and production instances in `index.ts`
- [ ] Add both instances to the respective namespace exports
- [ ] Update any frontend calls to use `getFirebaseFunctionName`
- [ ] Test in both staging and production environments

## Functions That Don't Need Database Parameter

Functions that don't access Firestore directly don't need the database parameter:
- Functions that only use Firebase Auth
- Functions that only make external API calls
- Functions that only use Cloud Storage
- Pure utility functions

## Migration Guide

If you find a function using the old pattern:

1. Add database parameter to function signature
2. Replace `getFirestore(app)` with `getFirestoreDatabase(app, database)`
3. Create separate instances in index.ts
4. Update namespace exports to use the correct instances
5. Update all frontend calls to use `getFirebaseFunctionName`
6. Test thoroughly in both environments

## Testing

To verify your function works correctly:

1. **Local Testing**: Functions should use staging database by default
2. **Staging Testing**: Deploy to staging and verify it uses staging database
3. **Production Testing**: Deploy to production and verify it uses production database

## Questions?

If you're unsure whether a function needs the database parameter, check if it:
- Calls `db.collection()`
- Uses Firestore queries
- Reads or writes documents

If yes to any of these, it needs the database parameter pattern.