#!/bin/bash

# Ford UI Sync Script
# This script updates the Ford UI submodule and ensures all dependencies are in sync
#
# Key Features:
# - Updates Ford UI submodule to latest version
# - Copies CSS files with theme-scoped variable transformations
# - Converts :root CSS variables to theme-specific classes (.ford_light/.lincoln_light)
# - Enables proper brand switching without CSS variable conflicts
#
# The theme scoping transformation is critical because Ford UI CSS files define
# variables at :root level, but for brand switching we need them scoped to
# theme classes to prevent override conflicts.

set -e  # Exit on error

echo "🔄 Syncing Ford UI submodule..."

# Navigate to monorepo root
cd "$(dirname "$0")/../../.."

# Update the Ford UI submodule
echo "📦 Fetching latest Ford UI changes..."
git submodule update --remote packages/ford-ui

# Copy CSS files to web-app
echo "📁 Copying Ford UI CSS files..."
FORD_SOURCE="packages/ford-ui/packages/@ui/ford-ui-components/src/styles"
WEB_APP_DEST="packages/web-app/src/styles"

# Create directories
mkdir -p "$WEB_APP_DEST/ford"
mkdir -p "$WEB_APP_DEST/lincoln"

# Copy and transform Ford CSS files
echo "🔧 Processing Ford CSS files with theme scoping..."
cp "$FORD_SOURCE/ford/_variables.css" "$WEB_APP_DEST/ford/"
cp "$FORD_SOURCE/ford/ford.css" "$WEB_APP_DEST/ford/"
cp "$FORD_SOURCE/ford/ford-font-families.css" "$WEB_APP_DEST/ford/"

# Transform Ford variables from :root to .ford_light theme scoping
sed -i '' 's/:root {/.ford_light {/' "$WEB_APP_DEST/ford/_variables.css"

echo "🔧 Processing Lincoln CSS files with theme scoping..."
# Copy Lincoln CSS files
cp "$FORD_SOURCE/lincoln/_variables.css" "$WEB_APP_DEST/lincoln/"
cp "$FORD_SOURCE/lincoln/lincoln.css" "$WEB_APP_DEST/lincoln/"
cp "$FORD_SOURCE/lincoln/lincoln-font-families.css" "$WEB_APP_DEST/lincoln/"

# Transform Lincoln variables from :root to .lincoln_light theme scoping
sed -i '' 's/:root {/.lincoln_light {/' "$WEB_APP_DEST/lincoln/_variables.css"

echo "✅ CSS files copied to web-app"

# No additional Ford UI patches needed - markdown processing handled in web-app

# Check if there are changes to commit
if git diff --quiet packages/ford-ui packages/web-app/src/styles/; then
    echo "✅ Ford UI is already up to date"
else
    echo "📝 Ford UI has updates"
    
    # Show what changed
    echo "Changes:"
    git diff --name-only packages/ford-ui packages/web-app/src/styles/ | head -10
    
    # Optional: Auto-commit the updates
    read -p "🤔 Commit Ford UI updates? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add packages/ford-ui packages/web-app/src/styles/
        git commit -m "chore: sync Ford UI CSS files and update submodule

Ford UI Updates:
$(cd packages/ford-ui && git log --oneline -3)

Updated CSS files:
- Ford brand styling (_variables.css, ford.css, ford-font-families.css)
- Lincoln brand styling (_variables.css, lincoln.css, lincoln-font-families.css)"
        echo "✅ Ford UI updates committed"
    fi
fi

# Update package dependencies if needed
echo "📦 Installing/updating dependencies..."
cd packages/web-app
pnpm install

echo "🎉 Ford UI sync complete!"
echo ""
echo "ℹ️  Available brands: Ford (ford_light/ford_dark) and Lincoln (lincoln_light/lincoln_dark)"
echo "ℹ️  CSS source: packages/ford-ui/packages/@ui/ford-ui-components/src/styles/"
echo "ℹ️  Theme scoping: CSS variables transformed from :root to theme-specific classes"
echo "ℹ️  Brand switching: Use className='ford_light' or 'lincoln_light' on #fd-nxt wrapper"
echo ""
echo "🔧 Key transformations applied:"
echo "   • Ford variables: :root → .ford_light"
echo "   • Lincoln variables: :root → .lincoln_light"
echo "   • This enables proper theme switching without variable conflicts"