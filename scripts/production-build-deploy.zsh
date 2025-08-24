#!/usr/bin/env zsh

set -euo pipefail

# Load Sentry auth token from environment file if not already set
if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
    if [[ -f "packages/web-app/.env.production" ]]; then
        export $(grep SENTRY_AUTH_TOKEN packages/web-app/.env.production | xargs)
    fi
fi

# Check required environment variables
if [[ -z "${SENTRY_AUTH_TOKEN:-}" ]]; then
    echo "❌ Missing required environment variable: SENTRY_AUTH_TOKEN"
    echo ""
    echo "Please ensure SENTRY_AUTH_TOKEN is set in packages/web-app/.env.production"
    echo "Or provide it as: SENTRY_AUTH_TOKEN=<token> ./scripts/production-build-deploy.zsh [BUILD_NUMBER]"
    echo ""
    echo "Optional:"
    echo "  BUILD_NUMBER: Custom build number (default: timestamp)"
    exit 1
fi


# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_BUCKET="survey.expansemarketing.com"
SENTRY_ORG="latitude-digital"
SENTRY_PROJECT="expanse-marketing"
BUILD_NUMBER=${1:-$(date +%s)}
VERSION_NUMBER="1.0.${BUILD_NUMBER}"

# Export Sentry environment variables
export SENTRY_AUTH_TOKEN
export SENTRY_ORG
export SENTRY_PROJECT
export SENTRY_LOG_LEVEL="debug"

echo -e "${BLUE}🚀 Starting production build and deployment${NC}"
echo -e "${BLUE}Version: ${VERSION_NUMBER}${NC}"

# Get current git commit
GIT_COMMIT=$(git rev-parse HEAD)
echo -e "${BLUE}Git commit: ${GIT_COMMIT}${NC}"

# Prompt for deployment type
echo -e "${YELLOW}📋 Select deployment option:${NC}"
echo "  1) Web only"
echo "  2) Functions only"
echo "  3) Both (Web + Functions)"
echo -n "Enter your choice (1-3): "
read DEPLOY_CHOICE

case $DEPLOY_CHOICE in
    1)
        DEPLOY_WEB=true
        DEPLOY_FUNCTIONS=false
        echo -e "${BLUE}Selected: Web only${NC}"
        ;;
    2)
        DEPLOY_WEB=false
        DEPLOY_FUNCTIONS=true
        echo -e "${BLUE}Selected: Functions only${NC}"
        ;;
    3)
        DEPLOY_WEB=true
        DEPLOY_FUNCTIONS=true
        echo -e "${BLUE}Selected: Both (Web + Functions)${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

if $DEPLOY_WEB; then
    # Step 1: Update version in package.json
    echo -e "${YELLOW}📦 Updating package version to ${VERSION_NUMBER}${NC}"
    cd packages/web-app
    sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"${VERSION_NUMBER}\"/" package.json
    echo -e "${GREEN}✅ Updated web-app version to ${VERSION_NUMBER}${NC}"
    cd ../..

    # Step 2: Install dependencies
    echo -e "${YELLOW}📥 Installing dependencies${NC}"
    pnpm install --prefer-offline
    echo -e "${GREEN}✅ Dependencies installed${NC}"

    # Step 3: Sync Ford UI
    echo -e "${YELLOW}🎨 Syncing Ford UI${NC}"
    ./packages/web-app/scripts/sync-ford-ui.sh
    echo -e "${GREEN}✅ Ford UI synced${NC}"

    # Step 4: Activate Kendo UI license
    echo -e "${YELLOW}🔑 Activating Kendo UI license${NC}"
    cd packages/web-app
    npx kendo-ui-license activate
    echo -e "${GREEN}✅ Kendo UI license activated${NC}"

    # Step 5: Create Sentry release
    echo -e "${YELLOW}📊 Creating Sentry release${NC}"
    pnpm sentry-cli releases new ${BUILD_NUMBER}
    pnpm sentry-cli releases set-commits ${BUILD_NUMBER} --commit latitude-digital/expanse-marketing-monorepo@${GIT_COMMIT}
    pnpm sentry-cli releases finalize ${BUILD_NUMBER}
    echo -e "${GREEN}✅ Sentry release created${NC}"

    # Step 6: Build the application
    echo -e "${YELLOW}🏗️  Building application${NC}"
    # Vite will automatically load .env.prod in production mode
    pnpm run build:production
    echo -e "${GREEN}✅ Application built${NC}"

    # Step 7: Deploy to S3
    echo -e "${YELLOW}☁️  Deploying to S3${NC}"

    # Upload all files except index.html and .map files with 1-week cache
    echo -e "${BLUE}Uploading assets with cache headers (excluding .map files)...${NC}"
    aws configure set default.s3.max_concurrent_requests 20
    aws configure set default.s3.max_bandwidth 100MB/s
    aws s3 sync build/ s3://${DEPLOY_BUCKET}/ \
        --exclude "index.html" \
        --exclude "*.map" \
        --exclude "**/*.map" \
        --cache-control "max-age=604800" \
        --delete

    # Upload index.html without caching
    echo -e "${BLUE}Uploading index.html without cache...${NC}"
    aws s3 cp build/index.html s3://${DEPLOY_BUCKET}/index.html \
        --cache-control "max-age=0"

    echo -e "${GREEN}✅ Deployed to S3${NC}"

    # Step 8: Finalize Sentry release with deployment
    echo -e "${YELLOW}📊 Finalizing Sentry deployment${NC}"
    pnpm sentry-cli releases deploys ${BUILD_NUMBER} new -e production
    echo -e "${GREEN}✅ Sentry deployment recorded${NC}"

    cd ../..
fi

if $DEPLOY_FUNCTIONS; then
    # Step 9: Build Firebase Functions
    echo -e "${YELLOW}🔥 Building Firebase Functions${NC}"
    cd packages/firebase

    # Switch to prod alias (this will make Firebase load .env.prod automatically)
    echo -e "${BLUE}Switching to prod Firebase alias${NC}"
    firebase use prod

    npm run build
    echo -e "${GREEN}✅ Firebase Functions built${NC}"

    # Step 10: Deploy Firebase Functions (prod namespace only)
    echo -e "${YELLOW}🚀 Deploying Firebase Functions to production${NC}"

    # Deploy only prod functions (no need to specify --project since we're using the alias)
    firebase deploy --only functions:prod

    # Deploy Firestore rules and indexes to PRODUCTION database only using production config
    firebase deploy --only firestore:rules,firestore:indexes --config firebase.production.json
    echo -e "${GREEN}✅ Firebase Functions deployed to production${NC}"

    cd ../..
fi

echo -e "${GREEN}🎉 Production deployment complete!${NC}"
if $DEPLOY_WEB; then
    echo -e "${GREEN}Web App: https://survey.expansemarketing.com/${NC}"
fi
if $DEPLOY_FUNCTIONS; then
    echo -e "${GREEN}Firebase Functions: Deployed to prod namespace${NC}"
fi
echo -e "${GREEN}Version: ${VERSION_NUMBER}${NC}"
echo -e "${GREEN}Build: ${BUILD_NUMBER}${NC}"