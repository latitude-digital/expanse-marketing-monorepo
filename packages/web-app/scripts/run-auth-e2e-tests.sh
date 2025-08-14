#!/bin/bash

# Auth E2E Test Runner Script
# Runs comprehensive authentication E2E tests with Playwright

set -e

echo "🧪 Starting Auth E2E Tests..."
echo "================================"

# Check if dev server is running
if ! curl -s http://localhost:8001 > /dev/null; then
    echo "❌ Web dev server is not running on port 8001"
    echo "   Please start it with: pnpm dev"
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Dev server is running on port 8001"

# Navigate to web-app directory
cd "$(dirname "$0")/.."

# Install Playwright if not already installed
if [ ! -d "node_modules/@playwright/test" ]; then
    echo "📦 Installing Playwright..."
    npx playwright install
fi

echo "🔧 Setting up test environment..."

# Create test users if they don't exist (optional - requires Firebase setup)
echo "ℹ️  Note: Make sure test users exist in Firebase:"
echo "   - testuser@expanse.demo / TestUser123!@#" 
echo "   - testadmin@expanse.demo / TestAdmin123!@#"
echo "   You can create them by running createTestUsers() in browser console"
echo ""

# Run the auth E2E tests
echo "🚀 Running authentication E2E tests..."
echo ""

# Run only the auth spec
npx playwright test tests/e2e/auth.spec.ts --reporter=html

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All authentication E2E tests passed!"
    echo "📊 View detailed results: npx playwright show-report"
else
    echo ""
    echo "❌ Some tests failed. Check the output above for details."
    echo "📊 View detailed results: npx playwright show-report"
    exit 1
fi

echo ""
echo "🎉 Auth E2E test run complete!"
echo "   Tests covered:"
echo "   • Login flows (valid/invalid credentials)"
echo "   • Remember me functionality"  
echo "   • Redirect to original URL after login"
echo "   • Logout functionality"
echo "   • Password reset flows"
echo "   • Protected routes access control"
echo "   • Session timeout handling"
echo "   • Cross-tab session management"
echo "   • Error recovery and edge cases"