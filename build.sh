#!/bin/bash
# build.sh - Build Google Maps Review Scraper extension

set -e  # Exit on error

echo "🔍 Checking dependencies..."

# Check if web-ext is installed
if ! command -v web-ext &> /dev/null; then
    echo "⚠️  web-ext not found. Install with: npm install -g web-ext"
    echo "📦 Building with zip instead..."
    USE_ZIP=true
else
    USE_ZIP=false
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
TOTAL_SIZE=$(du -sh . | cut -f1)
DICT_SIZE=$(du -sh dictionaries | cut -f1)
echo "   Total size: $TOTAL_SIZE"
echo "   Dictionary size: $DICT_SIZE"

if [ "$USE_ZIP" = true ]; then
    echo ""
    echo "📦 Building with zip..."

    # Remove old builds
    rm -f momus-gmaps-review-scanner.zip

    # Create ZIP file
    zip -r momus-gmaps-review-scanner.zip \
        manifest.json \
        popup/ \
        content/ \
        lib/ \
        dictionaries/ \
        icons/ \
        README.md \
        -x "*.DS_Store" \
        -x "*/__pycache__/*" \
        -x "*.pyc" \
        -x "*.sh"

    echo ""
    echo "✅ Build complete: momus-gmaps-review-scanner.zip"
    echo "   Size: $(du -sh momus-gmaps-review-scanner.zip | cut -f1)"
else
    echo ""
    echo "📦 Building with web-ext..."

    # Create artifacts directory if it doesn't exist
    mkdir -p artifacts

    # Build with web-ext
    web-ext build --source-dir . --artifacts-dir artifacts --overwrite-dest \
        --ignore-files build.sh package.sh setup-dev.sh TESTING.md INTERPRETING_RESULTS.md DICTIONARY_NOTES.md ANALYSIS_GUIDE.md CHANGELOG.md compare.html tools/ .venv/ .gitignore requirements.txt artifacts/ reviews/ reprocess.js analyze.js node_modules/ package.json package-lock.json .claude/

    echo ""
    echo "✅ Build complete!"
    ls -lh artifacts/*.zip | tail -1
fi

echo ""
echo "📋 Installation instructions:"
echo "   1. Open Firefox and go to about:debugging"
echo "   2. Click 'This Firefox'"
echo "   3. Click 'Load Temporary Add-on'"
echo "   4. Select manifest.json from this directory"
echo ""
echo "   Or install the ZIP file:"
echo "   1. Go to about:addons"
echo "   2. Click the gear icon"
echo "   3. Select 'Install Add-on From File'"
if [ "$USE_ZIP" = true ]; then
    echo "   4. Choose momus-gmaps-review-scanner.zip"
else
    echo "   4. Choose the .zip file from artifacts/"
fi
