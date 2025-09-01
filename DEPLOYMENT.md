# Deployment Guide

## Staging Deployment

### Prerequisites
1. AWS credentials configured for S3 deployment
2. Firebase CLI installed and authenticated
3. Sentry auth token available

### Deploy to Staging

```bash
# Run deployment (SENTRY_AUTH_TOKEN is loaded from .env.staging)
./scripts/staging-build-deploy.zsh

# Or override with a different token
SENTRY_AUTH_TOKEN=your_token_here ./scripts/staging-build-deploy.zsh
```

This script will:
1. Update version numbers
2. Install dependencies
3. Sync Ford UI components
4. Create Sentry release
5. Build the web application with staging environment
6. Deploy web app to S3 (staging.survey.expansemarketing.com)
7. Build Firebase functions
8. Deploy Firebase functions to staging namespace
9. Deploy Firestore rules and indexes

### What Gets Deployed

#### Web Application
- **URL**: https://survey.staging.expansemarketing.com/
- **S3 Bucket**: staging.survey.expansemarketing.com
- **Environment**: Uses `.env.staging` configuration
- **Namespace**: `staging` (for Firebase functions)

#### Firebase Functions
- **Namespace**: `staging-*` functions only
- **Database**: `staging` Firestore database
- **Functions Deployed**:
  - staging-setCloudFrontCookies
  - staging-checkSurveyLimit
  - staging-validateSurveyLimit
  - staging-getSurvey
  - staging-saveSurvey
  - staging-validateEmail
  - staging-checkInOutSurvey
  - staging-createNewUser

#### Firestore
- **Database**: `staging` database
- **Rules**: Applied from `packages/firebase/firestore.rules` to `staging` database specifically
- **Indexes**: Applied from `packages/firebase/firestore.indexes.json` to `staging` database specifically
- **Note**: Rules and indexes are database-specific and only applied to the staging database

### Environment Configuration

#### Web App (`.env.staging`)
```env
VITE_ENV=staging
VITE_FIREBASE_NAMESPACE=staging
VITE_USE_FUNCTIONS_EMULATOR=false
VITE_USE_AUTH_EMULATOR=false
VITE_USE_FIRESTORE_EMULATOR=false
```

#### Firebase Functions (`.env.staging`)
```env
LATITUDE_ENV=staging
DB_NAME=staging
```

### Verification After Deployment

1. **Check Web App**:
   - Visit https://survey.staging.expansemarketing.com/
   - Open browser console and verify:
     - `📦 Using namespace: staging`
     - `🔥 DB Service: Namespace = staging`

2. **Check Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/project/latitude-lead-system)
   - Verify functions are deployed with `staging-` prefix
   - Check Firestore `staging` database

3. **Test Survey Flow**:
   - Create an event in admin panel
   - Add survey questions
   - Take the survey
   - Verify data saves to staging database

## Production Deployment

### Deploy to Production

```bash
# Run deployment (SENTRY_AUTH_TOKEN is loaded from .env.production)
./scripts/production-build-deploy.zsh

# Or override with a different token
SENTRY_AUTH_TOKEN=your_token_here ./scripts/production-build-deploy.zsh
```

This script will:
1. Update version numbers
2. Install dependencies
3. Sync Ford UI components
4. Create Sentry release
5. Build the web application with production environment
6. Deploy web app to S3 (survey.expansemarketing.com)
7. Build Firebase functions
8. Deploy Firebase functions to prod namespace
9. Deploy Firestore rules and indexes to default database

### What Gets Deployed (Production)

#### Web Application
- **URL**: https://survey.expansemarketing.com/
- **S3 Bucket**: survey.expansemarketing.com
- **Environment**: Uses `.env.production` configuration
- **Namespace**: `prod` (for Firebase functions)

#### Firebase Functions
- **Namespace**: `prod-*` functions only
- **Database**: `(default)` Firestore database
- **Functions Deployed**:
  - prod-setCloudFrontCookies
  - prod-checkSurveyLimit
  - prod-validateSurveyLimit
  - prod-getSurvey
  - prod-saveSurvey
  - prod-validateEmail
  - prod-checkInOutSurvey
  - prod-createNewUser

#### Firestore
- **Database**: `(default)` database (production)
- **Rules**: Applied from `packages/firebase/firestore.rules` to `(default)` database specifically
- **Indexes**: Applied from `packages/firebase/firestore.indexes.json` to `(default)` database specifically
- **Note**: Rules and indexes are database-specific and only applied to the default (production) database

### Production Environment Configuration

#### Web App (`.env.production`)
```env
VITE_ENV=production
VITE_FIREBASE_NAMESPACE=prod
VITE_USE_FUNCTIONS_EMULATOR=false
VITE_USE_AUTH_EMULATOR=false
VITE_USE_FIRESTORE_EMULATOR=false
```

#### Firebase Functions (`.env.production`)
```env
LATITUDE_ENV=production
DB_NAME=(default)
```

## Local Development

### Using Emulators

```bash
# Run E2E tests with emulators
npm run test:e2e:auto

# Or manually start emulators
cd packages/firebase
npm run emulator
```

### Development Environment

#### Web App (`.env.development`)
For cloud staging:
```env
VITE_ENV=development
VITE_FIREBASE_NAMESPACE=staging
VITE_USE_FUNCTIONS_EMULATOR=false
VITE_USE_AUTH_EMULATOR=false
VITE_USE_FIRESTORE_EMULATOR=false
```

For local emulators:
```env
VITE_ENV=development
VITE_FIREBASE_NAMESPACE=staging
VITE_USE_FUNCTIONS_EMULATOR=true
VITE_USE_AUTH_EMULATOR=true
VITE_USE_FIRESTORE_EMULATOR=true
```

## Rollback Procedure

If issues occur after deployment:

1. **Web App Rollback**:
   - Previous builds are retained in S3
   - Can revert by re-uploading previous build

2. **Firebase Functions Rollback**:
   - Use Firebase Console to roll back to previous version
   - Or redeploy from previous git commit

## Database-Specific Configuration

Firebase uses multiple databases for different environments:

### Database Architecture
- **`(default)` database**: Production data
- **`staging` database**: Staging environment data

### firebase.json Configuration
The `firebase.json` file is configured to apply rules and indexes to specific databases:

```json
"firestore": [
  {
    "database": "(default)",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  {
    "database": "staging",
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
]
```

### Deployment Commands
- **Staging**: `firebase deploy --only functions:staging,"firestore:rules:staging","firestore:indexes:staging"`
- **Production**: `firebase deploy --only functions:prod,"firestore:rules:(default)","firestore:indexes:(default)"`

This ensures that:
1. Staging rules/indexes only apply to the `staging` database
2. Production rules/indexes only apply to the `(default)` database
3. Functions are namespaced appropriately (`staging-*` or `prod-*`)

## Monitoring

### Sentry Configuration

The project uses two separate Sentry projects:

1. **Web Application** (expanse-marketing)
   - DSN: Configured in `packages/web-app/src/App.tsx`
   - Environments: `development`, `staging`, `production`
   - Automatically set based on `VITE_ENV`

2. **Firebase Functions** (separate project)
   - DSN: Configured in `packages/firebase/src/functions.ts`
   - Environments: `staging`, `production`
   - Automatically set based on `LATITUDE_ENV`

Both projects share the same SENTRY_AUTH_TOKEN for deployment releases.

### Other Monitoring

- **Firebase Console**: Monitor function logs and database usage
- **CloudWatch**: Monitor S3 and CloudFront metrics