/**
 * VidZ Downloader - Frontend Application
 */

// State
let currentVideoUrl = '';
let currentDownloadId = null;
let progressInterval = null;

// DOM Elements - Download Tab
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

// DOM Elements - Search Tab
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchError = document.getElementById('searchError');
const searchResults = document.getElementById('searchResults');
const searchLoading = document.getElementById('searchLoading');

// DOM Elements - Tabs
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// ========================================
// Tab Navigation
// ========================================
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.dataset.tab;

        // Update tabs
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabId}Tab`).classList.add('active');
    });
});

// ========================================
// Download Tab Events
// ========================================
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

// ========================================
// Search Tab Events
// ========================================
searchBtn.addEventListener('click', performSearch);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// ========================================
// Download Tab Functions
// ========================================
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

// ========================================
// Search Tab Functions
// ========================================
async function performSearch() {
    const query = searchInput.value.trim();

    if (!query) {
        showSearchError('Veuillez entrer un mot-clé de recherche');
        return;
    }

    hideSearchError();
    searchResults.classList.add('hidden');
    searchLoading.classList.remove('hidden');
    setLoading(searchBtn, true);

    try {
        const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erreur lors de la recherche');
        }

        displaySearchResults(data.videos);

    } catch (err) {
        showSearchError(err.message || 'Impossible de rechercher les vidéos');
    } finally {
        searchLoading.classList.add('hidden');
        setLoading(searchBtn, false);
    }
}

function displaySearchResults(videos) {
    searchResults.innerHTML = '';

    if (!videos || videos.length === 0) {
        showSearchError('Aucune vidéo trouvée pour cette recherche');
        return;
    }

    videos.forEach(video => {
        const card = createVideoCard(video);
        searchResults.appendChild(card);
    });

    searchResults.classList.remove('hidden');
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';

    const thumbnailUrl = video.thumbnail || 'https://via.placeholder.com/200x350/1a1a2e/a855f7?text=TikTok';

    card.innerHTML = `
        <div class="video-card-thumbnail">
            <img src="${thumbnailUrl}" alt="${video.title}" onerror="this.src='https://via.placeholder.com/200x350/1a1a2e/a855f7?text=TikTok'">
            <div class="video-card-overlay">
                <button class="video-card-download">⬇️ Télécharger</button>
            </div>
        </div>
        <div class="video-card-info">
            <div class="video-card-title">${video.title || 'Vidéo TikTok'}</div>
            <div class="video-card-uploader">@${video.uploader || 'unknown'}</div>
        </div>
    `;

    // Click on card to download
    const downloadButton = card.querySelector('.video-card-download');
    downloadButton.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadFromSearch(video.url);
    });

    // Click on card to switch to download tab
    card.addEventListener('click', () => {
        downloadFromSearch(video.url);
    });

    return card;
}

function downloadFromSearch(url) {
    // Switch to download tab
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector('[data-tab="download"]').classList.add('active');

    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById('downloadTab').classList.add('active');

    // Set URL and fetch info
    urlInput.value = url;
    fetchVideoInfo();
}

// ========================================
// UI Helpers
// ========================================
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

function showSearchError(message) {
    searchError.querySelector('.error-text').textContent = message;
    searchError.classList.remove('hidden');
}

function hideSearchError() {
    searchError.classList.add('hidden');
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
