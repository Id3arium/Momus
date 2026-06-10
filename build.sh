#!/bin/bash
# build.sh - Build Momus (Google Maps Review Analyzer) extension
#
# Uses the project-local web-ext (a devDependency) via npx, so the build is
# identical on every machine regardless of what's installed globally.

set -e  # Exit on error

# Run from the project root (the directory this script lives in), so the build
# works no matter where it's invoked from.
cd "$(dirname "$0")"

echo "🔍 Checking dependencies..."

# web-ext is a devDependency; make sure node_modules is present before building.
if [ ! -x "node_modules/.bin/web-ext" ]; then
    echo "📦 Installing dependencies (web-ext)..."
    npm install
fi

echo ""
echo "✅ Validating manifest.json..."
if ! command -v jq &> /dev/null; then
    echo "   (jq not installed, skipping JSON validation)"
else
    jq empty manifest.json && echo "   ✓ manifest.json is valid JSON"
fi

echo ""
echo "📊 Checking file sizes..."
echo "   Total size:      $(du -sh . | cut -f1)"
echo "   Dictionary size: $(du -sh dictionaries | cut -f1)"

echo ""
echo "📦 Building with web-ext..."
mkdir -p artifacts

# Bundle only the files the extension ships; exclude docs, dev tooling, data, etc.
npx web-ext build --source-dir . --artifacts-dir artifacts --overwrite-dest \
    --ignore-files build.sh release.sh scripts/ docs/ tools/ .venv/ .gitignore artifacts/ reviews/ node_modules/ package.json package-lock.json .claude/

echo ""
echo "✅ Build complete!"
ls -lh artifacts/*.zip | tail -1

echo ""
echo "📋 Installation instructions:"
echo "   1. Open Firefox and go to about:debugging"
echo "   2. Click 'This Firefox'"
echo "   3. Click 'Load Temporary Add-on'"
echo "   4. Select manifest.json from this directory"
echo ""
echo "   Or install the built package:"
echo "   1. Go to about:addons"
echo "   2. Click the gear icon"
echo "   3. Select 'Install Add-on From File'"
echo "   4. Choose the .zip file from artifacts/"
