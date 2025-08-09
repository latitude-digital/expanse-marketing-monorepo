#!/bin/bash

# E2E Test Script for Firebase Emulator
# This script sets up the environment, runs tests, and restores settings

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."
WEB_APP_PATH="$PROJECT_ROOT/packages/web-app"
FIREBASE_PATH="$PROJECT_ROOT/packages/firebase"
ENV_FILE="$WEB_APP_PATH/.env.development"
ENV_BACKUP="$WEB_APP_PATH/.env.development.backup"

# Process IDs for cleanup
EMULATOR_PID=""
WEBAPP_PID=""

# Logging functions
log() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

step() {
    echo -e "\n${CYAN}═══ $1 ═══${NC}"
}

# Cleanup function
cleanup() {
    step "Cleanup"
    
    # Kill processes
    if [ ! -z "$EMULATOR_PID" ]; then
        info "Stopping emulators..."
        kill $EMULATOR_PID 2>/dev/null || true
        wait $EMULATOR_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$WEBAPP_PID" ]; then
        info "Stopping web app..."
        kill $WEBAPP_PID 2>/dev/null || true
        wait $WEBAPP_PID 2>/dev/null || true
    fi
    
    # Restore environment
    if [ -f "$ENV_BACKUP" ]; then
        info "Restoring original environment..."
        cp "$ENV_BACKUP" "$ENV_FILE"
        rm "$ENV_BACKUP"
        log "Original environment restored (pointing to cloud staging)"
    fi
}

# Set up trap for cleanup on exit
trap cleanup EXIT INT TERM

# Main execution
main() {
    echo -e "${CYAN}╔════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║   Firebase E2E Emulator Test       ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════╝${NC}"
    
    # Step 1: Setup environment
    step "Step 1: Configure environment for emulator"
    
    info "Backing up current .env.development..."
    cp "$ENV_FILE" "$ENV_BACKUP"
    
    info "Configuring for emulator mode..."
    # Update environment variables
    sed -i.tmp 's/VITE_USE_FUNCTIONS_EMULATOR=.*/VITE_USE_FUNCTIONS_EMULATOR=true/' "$ENV_FILE"
    sed -i.tmp 's/VITE_USE_AUTH_EMULATOR=.*/VITE_USE_AUTH_EMULATOR=true/' "$ENV_FILE"
    sed -i.tmp 's/VITE_USE_FIRESTORE_EMULATOR=.*/VITE_USE_FIRESTORE_EMULATOR=true/' "$ENV_FILE"
    
    # Add VITE_FIREBASE_MODE if not present
    if ! grep -q "VITE_FIREBASE_MODE" "$ENV_FILE"; then
        echo "VITE_FIREBASE_MODE=emulator" >> "$ENV_FILE"
    else
        sed -i.tmp 's/VITE_FIREBASE_MODE=.*/VITE_FIREBASE_MODE=emulator/' "$ENV_FILE"
    fi
    
    rm -f "$ENV_FILE.tmp"
    log "Environment configured for emulator"
    
    # Step 2: Build functions
    step "Step 2: Build Firebase functions"
    cd "$FIREBASE_PATH"
    npm run build
    log "Functions built successfully"
    
    # Step 3: Start emulators
    step "Step 3: Start Firebase emulators"
    cd "$FIREBASE_PATH"
    firebase emulators:start --only functions,firestore,auth &
    EMULATOR_PID=$!
    
    info "Waiting for emulators to start..."
    sleep 10
    
    # Check if emulators are running
    if curl -s http://localhost:4002 > /dev/null; then
        log "Emulators are running"
    else
        error "Emulators failed to start"
        exit 1
    fi
    
    # Step 4: Start web app
    step "Step 4: Start web application"
    cd "$WEB_APP_PATH"
    npm run dev &
    WEBAPP_PID=$!
    
    info "Waiting for web app to start..."
    sleep 10
    
    # Check if web app is running
    if curl -s http://localhost:8002 > /dev/null; then
        log "Web app is running"
    else
        error "Web app failed to start"
        exit 1
    fi
    
    # Step 5: Run tests
    step "Step 5: Run E2E tests"
    
    info "Services are ready. You can now:"
    echo "  1. Open http://localhost:4002 for Emulator UI"
    echo "  2. Open http://localhost:8002/admin for Admin Panel"
    echo "  3. Create a test user in Auth emulator"
    echo "  4. Create an event and add survey questions"
    echo "  5. Take the survey at http://localhost:8002/s/[event-id]"
    echo "  6. Verify data in Firestore emulator"
    echo ""
    
    # If playwright test exists, run it
    if [ -f "$SCRIPT_DIR/test-e2e-playwright.js" ]; then
        read -p "Run automated Playwright tests? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            node "$SCRIPT_DIR/test-e2e-playwright.js"
        else
            info "Manual testing mode. Press Ctrl+C when done to clean up."
            wait
        fi
    else
        info "Manual testing mode. Press Ctrl+C when done to clean up."
        wait
    fi
    
    log "E2E test completed!"
}

# Run main function
main