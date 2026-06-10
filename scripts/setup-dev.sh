#!/bin/bash
# setup-dev.sh - Set up isolated development environment with uv

set -e

# Run from the repo root (this script lives in scripts/), so the .venv and
# requirements.txt paths resolve no matter where it's invoked from.
cd "$(dirname "$0")/.."

echo "🔧 Setting up development environment for Momus (Google Maps Review Analyzer)..."
echo ""

# Make sure uv is in PATH
export PATH="$HOME/.local/bin:$PATH"

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ uv not found. Install it with:"
    echo "   curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

echo "✅ Found uv $(uv --version)"
echo ""

# Create virtual environment
if [ -d ".venv" ]; then
    echo "⚠️  .venv already exists. Delete it? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        rm -rf .venv
        echo "🗑️  Removed old .venv"
    else
        echo "✅ Using existing .venv"
    fi
fi

if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    uv venv
    echo "✅ Created .venv/"
fi

echo ""
echo "📥 Installing dependencies..."
uv pip install -r scripts/requirements.txt

echo ""
echo "✅ Development environment ready!"
echo ""
echo "📋 Next steps:"
echo "   1. Activate the environment:"
echo "      source .venv/bin/activate"
echo ""
echo "   2. In VS Code:"
echo "      - Press Cmd+Shift+P"
echo "      - Type 'Python: Select Interpreter'"
echo "      - Choose './.venv/bin/python'"
echo ""
echo "   3. To regenerate icons:"
echo "      python icons/create_icon_generator.py"
echo ""
echo "   4. To deactivate when done:"
echo "      deactivate"
echo ""
echo "💡 Your base Python environment is untouched!"
