#!/bin/bash

# Interactive build script for Meridian Events iOS app
# Supports both full builds (with TestFlight/App Store upload) and EAS updates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Meridian Events iOS Build Script    ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Function to prompt for input with a default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"

    if [ -n "$default" ]; then
        read -p "$(echo -e ${YELLOW}${prompt}${NC} [${default}]: )" value
        eval $var_name="${value:-$default}"
    else
        read -p "$(echo -e ${YELLOW}${prompt}${NC}: )" value
        eval $var_name="$value"
    fi
}

# Array to track newly set env vars for export at the end
NEWLY_SET_VARS=()

# Function to check and prompt for env var
check_env_var() {
    local var_name="$1"
    local prompt_text="$2"
    local is_secret="${3:-false}"

    if [ -z "${!var_name}" ]; then
        echo -e "${YELLOW}⚠️  ${var_name} is not set${NC}"

        if [ "$is_secret" = "true" ]; then
            read -sp "$(echo -e ${YELLOW}${prompt_text}${NC}: )" value
            echo ""
        else
            read -p "$(echo -e ${YELLOW}${prompt_text}${NC}: )" value
        fi

        export $var_name="$value"
        NEWLY_SET_VARS+=("$var_name")
        echo -e "${GREEN}✓${NC} ${var_name} set"
    else
        echo -e "${GREEN}✓${NC} ${var_name} already set"
    fi
}

# Step 1: Select environment
echo -e "${BLUE}Step 1: Select Environment${NC}"
echo "1) Staging"
echo "2) Production"
read -p "$(echo -e ${YELLOW}Choose environment [1]:${NC} )" env_choice
env_choice=${env_choice:-1}

if [ "$env_choice" = "2" ]; then
    ENVIRONMENT="production"
    APP_VARIANT="production"
    echo -e "${GREEN}Selected: Production${NC}"
else
    ENVIRONMENT="staging"
    APP_VARIANT="staging"
    echo -e "${GREEN}Selected: Staging${NC}"
fi

export APP_VARIANT

echo ""

# Step 2: Select build type
echo -e "${BLUE}Step 2: Select Build Type${NC}"
echo "1) EAS Update (over-the-air update, no native changes)"
echo "2) Full Build (with TestFlight/App Store upload)"
read -p "$(echo -e ${YELLOW}Choose build type [1]:${NC} )" build_choice
build_choice=${build_choice:-1}

if [ "$build_choice" = "2" ]; then
    BUILD_TYPE="full"
    echo -e "${GREEN}Selected: Full Build${NC}"
else
    BUILD_TYPE="update"
    echo -e "${GREEN}Selected: EAS Update${NC}"
fi

echo ""

# Step 3: Generate build number and version
echo -e "${BLUE}Step 3: Build Versioning${NC}"

# Read app version from package.json
APP_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}App Version (from package.json): ${APP_VERSION}${NC}"

# Build number is timestamp
BUILD_NUMBER=$(date +%Y%m%d%H%M%S)
echo -e "${GREEN}Build Number (timestamp): ${BUILD_NUMBER}${NC}"

# Full build version for display/logging
BUILD_VERSION="${APP_VERSION} (${BUILD_NUMBER})"
echo -e "${GREEN}Full Build Version: ${BUILD_VERSION}${NC}"

export APP_VERSION
export BUILD_NUMBER
export BUILD_VERSION

echo ""

# Step 4: Check required environment variables
echo -e "${BLUE}Step 4: Checking Required Environment Variables${NC}"

# Always required
check_env_var "MATCH_KEYCHAIN_NAME" "Enter Match keychain name" false
check_env_var "MATCH_PASSWORD" "Enter Match keychain password" true

# Full build specific
if [ "$BUILD_TYPE" = "full" ]; then
    check_env_var "APPLE_STORE_CONNECT_KEY_ID" "Enter App Store Connect API Key ID" false
    check_env_var "APPLE_STORE_CONNECT_ISSUER_ID" "Enter App Store Connect Issuer ID" false
    check_env_var "APPLE_STORE_CONNECT_KEY" "Enter App Store Connect API Key (base64)" true
fi

# EAS update specific
if [ "$BUILD_TYPE" = "update" ]; then
    check_env_var "EXPO_TOKEN" "Enter Expo token" true

    # Set WORKSPACE if not already set
    if [ -z "$WORKSPACE" ]; then
        export WORKSPACE="$(pwd)"
        echo -e "${GREEN}✓${NC} WORKSPACE set to: $WORKSPACE"
    else
        echo -e "${GREEN}✓${NC} WORKSPACE already set: $WORKSPACE"
    fi
fi

echo ""

# Output env vars for .zprofile if any were newly set
if [ ${#NEWLY_SET_VARS[@]} -gt 0 ]; then
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Copy to .zprofile for future use:   ║${NC}"
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo ""
    for var_name in "${NEWLY_SET_VARS[@]}"; do
        echo "export ${var_name}=\"${!var_name}\""
    done
    echo ""
fi

# Step 5: Confirm and execute
echo -e "${BLUE}Step 5: Build Summary${NC}"
echo -e "Environment:    ${GREEN}${ENVIRONMENT}${NC}"
echo -e "Build Type:     ${GREEN}${BUILD_TYPE}${NC}"
echo -e "App Version:    ${GREEN}${APP_VERSION}${NC}"
echo -e "Build Number:   ${GREEN}${BUILD_NUMBER}${NC}"
echo ""

# Determine fastlane lane
if [ "$BUILD_TYPE" = "update" ]; then
    LANE="${ENVIRONMENT}_updates"
else
    LANE="${ENVIRONMENT}"
fi

echo -e "Will run: ${YELLOW}bundle exec fastlane ios ${LANE}${NC}"
echo ""

read -p "$(echo -e ${YELLOW}Proceed with build? [Y/n]:${NC} )" confirm
confirm=${confirm:-Y}

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Build cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Starting Build Process         ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Change to script directory (should be packages/native-app)
cd "$(dirname "$0")"

# Run fastlane
echo -e "${GREEN}Running: bundle exec fastlane ios ${LANE}${NC}"
bundle exec fastlane ios "$LANE"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Build Complete! 🎉            ║${NC}"
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
