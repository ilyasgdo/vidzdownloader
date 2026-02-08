"""
VidZ Downloader - Web Application
A modern Flask web app for downloading videos.
"""

import os
import uuid
import threading
from flask import Flask, render_template, request, jsonify, send_file
from downloader import VideoDownloader, format_size, format_duration

app = Flask(__name__)
app.secret_key = os.urandom(24)

# Store for download progress
downloads = {}
downloader = VideoDownloader(output_dir='./downloads')


@app.route('/')
def index():
    """Serve the main page."""
    return render_template('index.html')


@app.route('/api/info', methods=['POST'])
def get_video_info():
    """Get video information from URL."""
    data = request.get_json()
    url = data.get('url', '').strip()
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    try:
        info = downloader.get_video_info(url)
        info['duration_formatted'] = format_duration(info.get('duration', 0))
        return jsonify(info)
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@app.route('/api/download', methods=['POST'])
def start_download():
    """Start a video download."""
    data = request.get_json()
    url = data.get('url', '').strip()
    quality = data.get('quality', 'best')
    audio_only = data.get('audioOnly', False)
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    # Create unique download ID
    download_id = str(uuid.uuid4())
    
    # Initialize download state
    downloads[download_id] = {
        'status': 'starting',
        'progress': 0,
        'speed': '',
        'eta': '',
        'filename': '',
        'error': None,
    }
    
    def progress_callback(info):
        if info['status'] == 'downloading':
            total = info.get('total_bytes', 0)
            downloaded = info.get('downloaded_bytes', 0)
            
            if total > 0:
                progress = (downloaded / total) * 100
            else:
                progress = 0
            
            downloads[download_id].update({
                'status': 'downloading',
                'progress': round(progress, 1),
                'speed': format_size(info.get('speed', 0)) + '/s' if info.get('speed') else '',
                'eta': f"{info.get('eta', 0)}s" if info.get('eta') else '',
                'downloaded': format_size(downloaded),
                'total': format_size(total),
            })
        elif info['status'] == 'finished':
            downloads[download_id]['status'] = 'processing'
    
    def download_thread():
        try:
            result = downloader.download(
                url=url,
                quality=quality,
                audio_only=audio_only,
                progress_callback=progress_callback
            )
            
            if result['success']:
                downloads[download_id].update({
                    'status': 'completed',
                    'progress': 100,
                    'filename': result['filename'],
                    'filepath': result['filepath'],
                    'title': result['title'],
                })
            else:
                downloads[download_id].update({
                    'status': 'error',
                    'error': result.get('error', 'Unknown error'),
                })
        except Exception as e:
            downloads[download_id].update({
                'status': 'error',
                'error': str(e),
            })
    
    # Start download in background thread
    thread = threading.Thread(target=download_thread)
    thread.start()
    
    return jsonify({'downloadId': download_id})


@app.route('/api/progress/<download_id>')
def get_progress(download_id):
    """Get download progress."""
    if download_id not in downloads:
        return jsonify({'error': 'Download not found'}), 404
    
    return jsonify(downloads[download_id])


@app.route('/api/file/<download_id>')
def download_file(download_id):
    """Download the completed file."""
    if download_id not in downloads:
        return jsonify({'error': 'Download not found'}), 404
    
    download = downloads[download_id]
    
    if download['status'] != 'completed':
        return jsonify({'error': 'Download not ready'}), 400
    
    filepath = download.get('filepath')
    if not filepath or not os.path.exists(filepath):
        return jsonify({'error': 'File not found'}), 404
    
    return send_file(
        filepath,
        as_attachment=True,
        download_name=download.get('filename', 'video.mp4')
    )


if __name__ == '__main__':
    print('\n🎬 VidZ Downloader - Web Server')
    print('=' * 40)
    print('Open http://localhost:5000 in your browser')
    print('=' * 40 + '\n')
    app.run(debug=True, host='0.0.0.0', port=5000)
