#!/usr/bin/env python3
"""
Video Downloader CLI - Download videos from various platforms.

Usage:
    python cli.py <URL>
    python cli.py <URL> --quality 720p
    python cli.py <URL> --audio-only
    python cli.py <URL> --output ./my_videos
"""

import argparse
import sys
from downloader import VideoDownloader, format_size, format_duration


def create_progress_bar(percentage: float, width: int = 40) -> str:
    """Create a text-based progress bar."""
    filled = int(width * percentage / 100)
    bar = '█' * filled + '░' * (width - filled)
    return f'[{bar}]'


def print_progress(info: dict) -> None:
    """Print download progress to terminal."""
    if info['status'] == 'downloading':
        total = info.get('total_bytes', 0)
        downloaded = info.get('downloaded_bytes', 0)
        speed = info.get('speed', 0)
        eta = info.get('eta', 0)
        
        if total > 0:
            percentage = (downloaded / total) * 100
        else:
            percentage = 0
        
        progress_bar = create_progress_bar(percentage)
        speed_str = format_size(speed) + '/s' if speed else 'N/A'
        eta_str = f'{eta}s' if eta else 'N/A'
        
        # Clear line and print progress
        sys.stdout.write(f'\r{progress_bar} {percentage:5.1f}% | {format_size(downloaded)}/{format_size(total)} | {speed_str} | ETA: {eta_str}')
        sys.stdout.flush()
    
    elif info['status'] == 'finished':
        sys.stdout.write('\n')
        print('✅ Download complete!')


def main():
    parser = argparse.ArgumentParser(
        description='🎬 VidZ Downloader - Download videos from various platforms',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python cli.py "https://youtube.com/watch?v=..."
  python cli.py "https://youtube.com/watch?v=..." --quality 720p
  python cli.py "https://youtube.com/watch?v=..." --audio-only
  python cli.py "https://youtube.com/watch?v=..." --output ~/Videos

Supported platforms: YouTube, Vimeo, TikTok, Twitter, Instagram, and many more!
        '''
    )
    
    parser.add_argument(
        'url',
        help='URL of the video to download'
    )
    
    parser.add_argument(
        '-o', '--output',
        default='./downloads',
        help='Output directory (default: ./downloads)'
    )
    
    parser.add_argument(
        '-q', '--quality',
        choices=['best', '1080p', '720p', '480p', '360p'],
        default='best',
        help='Video quality (default: best)'
    )
    
    parser.add_argument(
        '-a', '--audio-only',
        action='store_true',
        help='Download audio only (MP3)'
    )
    
    parser.add_argument(
        '-i', '--info',
        action='store_true',
        help='Show video info without downloading'
    )
    
    args = parser.parse_args()
    
    # Initialize downloader
    downloader = VideoDownloader(output_dir=args.output)
    
    print(f'\n🎬 VidZ Downloader')
    print('=' * 50)
    
    # Fetch video info
    print(f'\n📡 Fetching video info...')
    try:
        info = downloader.get_video_info(args.url)
    except Exception as e:
        print(f'\n❌ Error: Could not fetch video info')
        print(f'   {str(e)}')
        sys.exit(1)
    
    # Display video info
    print(f'\n📺 Title: {info["title"]}')
    print(f'👤 Channel: {info["uploader"]}')
    print(f'⏱️  Duration: {format_duration(info["duration"])}')
    if info['view_count']:
        print(f'👁️  Views: {info["view_count"]:,}')
    
    # If info only, exit here
    if args.info:
        print(f'\n📋 Available qualities:')
        for fmt in info.get('formats', [])[:5]:
            print(f'   • {fmt["quality"]}')
        sys.exit(0)
    
    # Download
    quality_msg = 'audio only (MP3)' if args.audio_only else args.quality
    print(f'\n⬇️  Downloading ({quality_msg})...\n')
    
    result = downloader.download(
        url=args.url,
        quality=args.quality,
        audio_only=args.audio_only,
        progress_callback=print_progress
    )
    
    if result['success']:
        print(f'\n📁 Saved to: {result["filepath"]}')
        print(f'\n✨ Done!')
    else:
        print(f'\n❌ Download failed: {result.get("error", "Unknown error")}')
        sys.exit(1)


if __name__ == '__main__':
    main()
