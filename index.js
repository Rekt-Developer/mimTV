const playlistUrl = "https://raw.githubusercontent.com/Rekt-Developer/mimTV/main/SumonNetwork-Playlist-official.m3u8";
const video = document.getElementById("videoPlayer");
const videoLoading = document.getElementById("videoLoading");
const channelLoading = document.getElementById("channelLoading");
const channelGrid = document.getElementById("channelGrid");
const searchButton = document.getElementById("searchButton");
let player;
let channels = [];

// Initialize Plyr with advanced options
function initPlayer() {
    if (player) {
        player.destroy();
    }
    player = new Plyr(video, {
        controls: [
            'play-large', 'play', 'progress', 'current-time',
            'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        settings: ['captions', 'quality', 'speed'],
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 2] },
        keyboard: { focused: true, global: true },
        tooltips: { controls: true, seek: true },
        captions: { active: true, language: 'auto', update: true }
    });
}

// Advanced HLS player with error handling and quality switching
function loadVideo(url, channelName) {
    showMessage(`Loading ${channelName}...`, 'success');
    videoLoading.style.display = "block";
    
    if (Hls.isSupported()) {
        const hls = new Hls({
            debug: false,
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
        });

        hls.loadSource(url);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, function(event, data) {
            const availableQualities = hls.levels.map((l) => l.height);
            
            // Update Plyr with new quality levels
            player.quality = availableQualities;
            
            // Set default quality to highest
            player.quality = availableQualities[availableQualities.length - 1];

            initPlayer();
            video.play().catch(e => console.log("Auto-play prevented:", e));
            videoLoading.style.display = "none";
            showMessage(`Now playing: ${channelName}`, 'success');
        });

        hls.on(Hls.Events.ERROR, function(event, data) {
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        showMessage("Network error, trying to recover...", 'error');
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        showMessage("Media error, trying to recover...", 'error');
                        hls.recoverMediaError();
                        break;
                    default:
                        showMessage(`Unrecoverable error while playing ${channelName}. Please try another channel.`, 'error');
                        hls.destroy();
                        break;
                }
            }
        });

        // Handle quality changes
        player.on('qualitychange', event => {
            hls.levels.forEach((level, levelIndex) => {
                if (level.height === event.detail.quality) {
                    hls.currentLevel = levelIndex;
                }
            });
        });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        initPlayer();
        video.play().catch(e => console.log("Auto-play prevented:", e));
        videoLoading.style.display = "none";
        showMessage(`Now playing: ${channelName}`, 'success');
    } else {
        showMessage("Your browser does not support HLS playback.", 'error');
    }
}

// Show message with auto-dismissal
function showMessage(text, type = 'info') {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;
    messageDiv.textContent = text;
    messageDiv.setAttribute('role', 'alert');
    
    const existingMessage = document.querySelector(".message");
    if (existingMessage) {
        existingMessage.remove();
    }
    
    document.body.insertBefore(messageDiv, document.body.firstChild);
    setTimeout(() => messageDiv.remove(), 5000);
}

// Parse M3U file with improved error handling and CORS handling
async function loadChannels() {
    try {
        const response = await fetch(playlistUrl, {
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Origin': window.location.origin
            }
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        channels = await parseAndValidateM3U(text);
        if (channels.length === 0) throw new Error("No valid channels found in playlist");
        displayChannels(channels);
        showMessage(`Loaded ${channels.length} channels successfully`, 'success');
    } catch (error) {
        channelLoading.textContent = `Failed to load channels: ${error.message}`;
        console.error("Channel loading error:", error);
        showMessage(`Error: ${error.message}`, 'error');
    }
}

// Parse M3U playlist with enhanced validation and stream checking
async function parseAndValidateM3U(data) {
    const lines = data.split("\n");
    const parsedChannels = [];
    let currentChannel = {};

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith("#EXTINF:")) {
            currentChannel = {};
            const nameMatch = trimmedLine.match(/,(.*)$/);
            const logoMatch = trimmedLine.match(/tvg-logo="(.*?)"/);
            currentChannel.name = nameMatch ? nameMatch[1].trim() : "Unnamed Channel";
            currentChannel.logo = logoMatch ? logoMatch[1] : "";
        } else if (trimmedLine && !trimmedLine.startsWith("#")) {
            currentChannel.url = trimmedLine;
            if (currentChannel.url && isValidUrl(currentChannel.url)) {
                if (await isStreamValid(currentChannel.url)) {
                    parsedChannels.push({ ...currentChannel });
                }
            }
        }
    }

    return parsedChannels;
}

// Validate URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Check if stream is valid
async function isStreamValid(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        return true; // If we get here, the stream is likely valid
    } catch (error) {
        console.warn(`Invalid stream: ${url}`, error);
        return false;
    }
}

// Display channels with lazy loading for images and accessibility improvements
function displayChannels(channelsToDisplay) {
    channelGrid.innerHTML = "";
    channelsToDisplay.forEach((channel, index) => {
        const channelDiv = document.createElement("div");
        channelDiv.className = "channel";
        channelDiv.setAttribute('role', 'listitem');
        channelDiv.tabIndex = 0;
        channelDiv.onclick = () => loadVideo(channel.url, channel.name);
        channelDiv.onkeypress = (e) => {
            if (e.key === 'Enter') {
                loadVideo(channel.url, channel.name);
            }
        };

        if (channel.logo) {
            const img = document.createElement("img");
            img.loading = "lazy";
            img.src = channel.logo;
            img.alt = `${channel.name} logo`;
            img.onerror = () => {
                img.src = 'https://via.placeholder.com/150?text=No+Image';
                img.alt = 'No image available';
            };
            channelDiv.appendChild(img);
        } else {
            const placeholderImg = document.createElement("div");
            placeholderImg.style.width = '100%';
            placeholderImg.style.height = '80px';
            placeholderImg.style.backgroundColor = '#333';
            placeholderImg.style.display = 'flex';
            placeholderImg.style.alignItems = 'center';
            placeholderImg.style.justifyContent = 'center';
            placeholderImg.textContent = 'No Image';
            channelDiv.appendChild(placeholderImg);
        }

        const name = document.createElement("span");
        name.textContent = channel.name;
        channelDiv.appendChild(name);

        channelGrid.appendChild(channelDiv);
    });
    
    channelLoading.style.display = "none";
    channelGrid.style.display = "grid";
}

// Filter channels with debouncing and performance optimization
let filterTimeout;
function filterChannels() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        const searchTerm = document.getElementById("searchInput").value.toLowerCase();
        const filteredChannels = channels.filter(channel => 
            channel.name.toLowerCase().includes(searchTerm)
        );
        displayChannels(filteredChannels);
        showMessage(`Found ${filteredChannels.length} channels`, 'info');
    }, 300);
}

// Add search input event listener
document.getElementById("searchInput").addEventListener("input", filterChannels);
searchButton.addEventListener("click", filterChannels);

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    loadChannels();
    initPlayer(); // Initialize player on page load
});

// Handle network status changes
window.addEventListener('online', () => showMessage("You are back online", 'success'));
window.addEventListener('offline', () => showMessage("You are offline. Some features may be unavailable.", 'error'));
