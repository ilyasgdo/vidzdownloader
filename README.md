# 🎬 VidZ Downloader

A modern video downloader with a beautiful web UI and command-line interface.

Download videos from YouTube, TikTok, Twitter, Instagram, Vimeo, and 1000+ more sites.

![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0+-green)
![yt-dlp](https://img.shields.io/badge/yt--dlp-latest-red)

## ✨ Features

- 🌐 **Web Application** - Beautiful glassmorphism UI
- 💻 **CLI Tool** - Simple command-line interface
- 📺 **Video Quality** - Choose from best, 1080p, 720p, 480p, 360p
- 🎵 **Audio Only** - Extract audio as MP3
- 📊 **Progress Tracking** - Real-time download progress
- 🌍 **1000+ Sites** - YouTube, TikTok, Twitter, Instagram, Vimeo, and more

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/vidzdownloader.git
cd vidzdownloader

# Run the installation script
chmod +x install.sh
./install.sh

# Activate the virtual environment
source venv/bin/activate
```

### Web Application

```bash
python app.py
```

Then open [http://localhost:5000](http://localhost:5000) in your browser.

### Command Line

```bash
# Basic usage
python cli.py "https://youtube.com/watch?v=..."

# Choose quality
python cli.py "https://youtube.com/watch?v=..." --quality 720p

# Audio only (MP3)
python cli.py "https://youtube.com/watch?v=..." --audio-only

# Custom output folder
python cli.py "https://youtube.com/watch?v=..." --output ~/Videos

# Show video info without downloading
python cli.py "https://youtube.com/watch?v=..." --info
```

## 📋 CLI Options

| Option | Description |
|--------|-------------|
| `-o, --output` | Output directory (default: ./downloads) |
| `-q, --quality` | Video quality: best, 1080p, 720p, 480p, 360p |
| `-a, --audio-only` | Download audio only as MP3 |
| `-i, --info` | Show video info without downloading |

## 🛠️ Requirements

- Python 3.8+
- FFmpeg (for audio extraction)

### Install FFmpeg

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
# Download from https://ffmpeg.org/download.html
```

## 📁 Project Structure

```
vidzdownloader/
├── app.py           # Flask web server
├── cli.py           # Command-line interface
├── downloader.py    # Core download engine
├── requirements.txt # Python dependencies
├── install.sh       # Installation script
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── templates/
│   └── index.html
└── downloads/       # Downloaded videos
```

## 🎨 Screenshots

The web interface features a modern glassmorphism design with:
- Dark theme with purple/blue gradients
- Smooth animations
- Real-time progress tracking
- Mobile responsive layout

## ⚠️ Disclaimer

This tool is for personal use only. Respect copyright laws and terms of service of the platforms you download from.

## 📄 License

MIT License