"""
Core video download functionality using yt-dlp.
Shared between CLI and web application.
"""

import os
import yt_dlp
from typing import Dict, Any, Optional, Callable


class VideoDownloader:
    """Video downloader using yt-dlp."""
    
    QUALITY_OPTIONS = {
        'best': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '1080p': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best',
        '720p': 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best',
        '480p': 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best',
        '360p': 'bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best',
        'audio': 'bestaudio[ext=m4a]/bestaudio',
    }
    
    def __init__(self, output_dir: str = "./downloads"):
        """Initialize downloader with output directory."""
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def get_video_info(self, url: str) -> Dict[str, Any]:
        """
        Fetch video information without downloading.
        
        Args:
            url: Video URL
            
        Returns:
            Dictionary with video info (title, thumbnail, duration, formats)
        """
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'nocheckcertificate': True,  # Fix SSL issues on macOS
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Get available formats
            formats = []
            if info.get('formats'):
                seen_heights = set()
                for f in info['formats']:
                    height = f.get('height')
                    if height and height not in seen_heights:
                        seen_heights.add(height)
                        formats.append({
                            'quality': f'{height}p',
                            'height': height,
                            'ext': f.get('ext', 'mp4')
                        })
                formats.sort(key=lambda x: x['height'], reverse=True)
            
            return {
                'title': info.get('title', 'Unknown'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration', 0),
                'duration_string': info.get('duration_string', ''),
                'uploader': info.get('uploader', 'Unknown'),
                'view_count': info.get('view_count', 0),
                'formats': formats,
                'url': url,
            }
    
    def download(
        self,
        url: str,
        quality: str = 'best',
        audio_only: bool = False,
        progress_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ) -> Dict[str, Any]:
        """
        Download video from URL.
        
        Args:
            url: Video URL
            quality: Quality option (best, 1080p, 720p, 480p, 360p, audio)
            audio_only: If True, download audio only
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dictionary with download result (success, filename, filepath)
        """
        if audio_only:
            quality = 'audio'
        
        format_str = self.QUALITY_OPTIONS.get(quality, self.QUALITY_OPTIONS['best'])
        
        def progress_hook(d):
            if progress_callback and d['status'] == 'downloading':
                progress_callback({
                    'status': 'downloading',
                    'downloaded_bytes': d.get('downloaded_bytes', 0),
                    'total_bytes': d.get('total_bytes') or d.get('total_bytes_estimate', 0),
                    'speed': d.get('speed', 0),
                    'eta': d.get('eta', 0),
                    'filename': d.get('filename', ''),
                    'percentage': d.get('_percent_str', '0%').strip(),
                })
            elif progress_callback and d['status'] == 'finished':
                progress_callback({
                    'status': 'finished',
                    'filename': d.get('filename', ''),
                })
        
        ydl_opts = {
            'format': format_str,
            'outtmpl': os.path.join(self.output_dir, '%(title)s.%(ext)s'),
            'progress_hooks': [progress_hook],
            'postprocessors': [],
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,  # Fix SSL issues on macOS
        }
        
        if audio_only:
            ydl_opts['postprocessors'].append({
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            })
        
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                filename = ydl.prepare_filename(info)
                
                # Adjust filename for audio extraction
                if audio_only:
                    filename = os.path.splitext(filename)[0] + '.mp3'
                
                return {
                    'success': True,
                    'title': info.get('title', 'Unknown'),
                    'filename': os.path.basename(filename),
                    'filepath': filename,
                }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }


def format_size(bytes_size: int) -> str:
    """Format bytes to human readable size."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024:
            return f"{bytes_size:.1f} {unit}"
        bytes_size /= 1024
    return f"{bytes_size:.1f} TB"


def format_duration(seconds: int) -> str:
    """Format seconds to human readable duration."""
    if not seconds:
        return "Unknown"
    
    hours, remainder = divmod(seconds, 3600)
    minutes, secs = divmod(remainder, 60)
    
    if hours:
        return f"{int(hours)}:{int(minutes):02d}:{int(secs):02d}"
    return f"{int(minutes)}:{int(secs):02d}"
