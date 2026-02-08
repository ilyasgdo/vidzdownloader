#!/bin/bash

# VidZ Downloader - Installation Script
# =====================================

echo ""
echo "🎬 VidZ Downloader - Installation"
echo "=================================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    echo "   Please install Python 3.8+ and try again."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Create virtual environment
echo ""
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
echo ""
echo "⬆️  Upgrading pip..."
pip install --upgrade pip -q

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
pip install -r requirements.txt -q

# Create downloads folder
echo ""
echo "📁 Creating downloads folder..."
mkdir -p downloads

echo ""
echo "✅ Installation complete!"
echo ""
echo "=================================="
echo "🚀 HOW TO USE"
echo "=================================="
echo ""
echo "1. Activate the virtual environment:"
echo "   source venv/bin/activate"
echo ""
echo "2. WEB APPLICATION:"
echo "   python app.py"
echo "   Then open http://localhost:5000"
echo ""
echo "3. COMMAND LINE:"
echo "   python cli.py <URL>"
echo "   python cli.py <URL> --quality 720p"
echo "   python cli.py <URL> --audio-only"
echo ""
echo "=================================="
