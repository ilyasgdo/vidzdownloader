/**
 * VidZ Downloader - Frontend Application
 */

// State
let currentVideoUrl = '';
let currentDownloadId = null;
let progressInterval = null;

// DOM Elements
const urlInput = document.getElementById('urlInput');
const pasteBtn = document.getElementById('pasteBtn');
const fetchBtn = document.getElementById('fetchBtn');
const videoInfo = document.getElementById('videoInfo');
const errorMessage = document.getElementById('errorMessage');
const thumbnail = document.getElementById('thumbnail');
const videoTitle = document.getElementById('videoTitle');
const videoChannel = document.getElementById('videoChannel');
const duration = document.getElementById('duration');
const viewCount = document.getElementById('viewCount');
const qualitySelect = document.getElementById('qualitySelect');
const audioOnly = document.getElementById('audioOnly');
const downloadBtn = document.getElementById('downloadBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const progressSpeed = document.getElementById('progressSpeed');
const progressEta = document.getElementById('progressEta');
const successSection = document.getElementById('successSection');
const successFilename = document.getElementById('successFilename');
const saveFileBtn = document.getElementById('saveFileBtn');
const newDownloadBtn = document.getElementById('newDownloadBtn');

// Event Listeners
pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        urlInput.value = text;
        urlInput.focus();
    } catch (err) {
        console.error('Failed to paste:', err);
    }
});

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchVideoInfo();
    }
});

fetchBtn.addEventListener('click', fetchVideoInfo);
downloadBtn.addEventListener('click', startDownload);
newDownloadBtn.addEventListener('click', resetUI);

saveFileBtn.addEventListener('click', () => {
    if (currentDownloadId) {
        window.location.href = `/api/file/${currentDownloadId}`;
    }
});

// Auto-detect URL on paste
urlInput.addEventListener('paste', () => {
    setTimeout(() => {
        if (urlInput.value.match(/^https?:\/\//)) {
            fetchVideoInfo();
        }
    }, 100);
});

// Functions
async function fetchVideoInfo() {
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Veuillez entrer une URL');
        return;
    }
    
    if (!url.match(/^https?:\/\//)) {
        showError('URL invalide. L\'URL doit commencer par http:// ou https://');
        return;
    }
    
    hideError();
    hideVideoInfo();
    setLoading(fetchBtn, true);
    
    try {
        const response = await fetch('/api/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la récupération');
        }
        
        currentVideoUrl = url;
        displayVideoInfo(data);
        
    } catch (err) {
        showError(err.message || 'Impossible de récupérer les informations de la vidéo');
    } finally {
        setLoading(fetchBtn, false);
    }
}

function displayVideoInfo(info) {
    thumbnail.src = info.thumbnail || '';
    videoTitle.textContent = info.title;
    videoChannel.textContent = info.uploader || '';
    duration.textContent = info.duration_formatted || '';
    
    if (info.view_count) {
        viewCount.textContent = `${formatNumber(info.view_count)} vues`;
    } else {
        viewCount.textContent = '';
    }
    
    videoInfo.classList.remove('hidden');
}

async function startDownload() {
    const quality = qualitySelect.value;
    const isAudioOnly = audioOnly.checked;
    
    setLoading(downloadBtn, true);
    hideVideoInfo();
    
    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: currentVideoUrl,
                quality,
                audioOnly: isAudioOnly
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors du téléchargement');
        }
        
        currentDownloadId = data.downloadId;
        showProgressSection();
        startProgressPolling();
        
    } catch (err) {
        showError(err.message);
        showVideoInfo();
    } finally {
        setLoading(downloadBtn, false);
    }
}

function startProgressPolling() {
    progressInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/progress/${currentDownloadId}`);
            const data = await response.json();
            
            if (data.status === 'downloading' || data.status === 'processing') {
                updateProgress(data);
            } else if (data.status === 'completed') {
                stopProgressPolling();
                showSuccess(data);
            } else if (data.status === 'error') {
                stopProgressPolling();
                hideProgressSection();
                showError(data.error || 'Erreur lors du téléchargement');
                showVideoInfo();
            }
        } catch (err) {
            console.error('Progress polling error:', err);
        }
    }, 500);
}

function stopProgressPolling() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

function updateProgress(data) {
    const percent = data.progress || 0;
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    progressSpeed.textContent = data.speed || '';
    progressEta.textContent = data.eta ? `ETA: ${data.eta}` : '';
}

function showSuccess(data) {
    hideProgressSection();
    successFilename.textContent = data.filename || 'Fichier téléchargé';
    successSection.classList.remove('hidden');
}

function resetUI() {
    urlInput.value = '';
    currentVideoUrl = '';
    currentDownloadId = null;
    hideError();
    hideVideoInfo();
    hideProgressSection();
    successSection.classList.add('hidden');
    urlInput.focus();
}

// UI Helpers
function setLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function showError(message) {
    errorMessage.querySelector('.error-text').textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showVideoInfo() {
    videoInfo.classList.remove('hidden');
}

function hideVideoInfo() {
    videoInfo.classList.add('hidden');
}

function showProgressSection() {
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    progressSpeed.textContent = '';
    progressEta.textContent = '';
    progressSection.classList.remove('hidden');
}

function hideProgressSection() {
    progressSection.classList.add('hidden');
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Focus input on load
urlInput.focus();
