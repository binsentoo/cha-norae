// main.js
import { startOAuth, refreshAccessToken, handleOAuthCallback, getAccessToken } from './auth.js';
import { startPolling, getEstimatedProgressMs } from './player.js';
import { fetchLyrics, getActiveLineIndex } from './lyrics.js';
import { skipSong } from './spotify.js';
import { getActiveUserId, getDisplayName } from './storage.js';

// CONFIG & STATE
const params = new URLSearchParams(window.location.hash.slice(1));
const isCallback = params.has('access_token') || params.has('error');

let currentLyrics = null;
let currentTrackDuration = null;

// Determines whether to send user to login or music screen
async function init() {
    if (isCallback) { // User just logged in
        const result = await handleOAuthCallback();
        if (result.success) enterApp();
    } else if (getActiveUserId()) { // Returning user with session
        const refreshed = await refreshAccessToken();
        if (refreshed) enterApp(); else setupLoginScreen();
    } else { // New/unknown user
        setupLoginScreen();
    }

    // Core persistent UI routines
    setupGlobalEventListeners();
    updateClock();
    setInterval(updateClock, 10000); 
    requestAnimationFrame(renderLoop);
}

function enterApp() {
    startPolling(handleTrackUpdate);

    document.getElementById("connect-screen").hidden = true;
    document.getElementById("player-screen").hidden = false;
    document.getElementById("display-name").textContent = getDisplayName(getActiveUserId());
}

function setupLoginScreen() {
    document.getElementById("connect-btn").addEventListener('click', startOAuth);
}

// EVENT LISTENERS
function setupGlobalEventListeners() {
    // song skip button
    document.getElementById("skip-btn").addEventListener('click', async () => {
        try {
            await skipSong(getAccessToken());
        } catch (e) {
            if (e.status === 401) {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    await skipSong(getAccessToken()); // retry with fresh token
                }
            }
        }
    });

    // font size button
    document.getElementById("change-size").addEventListener('click', changeSize);
}

// DATA UPDATES & RENDERING LOOPS
async function handleTrackUpdate(track) {
    if (track === null) {
        document.getElementById("current-track").textContent = "no song is playing rn";
        return;
    }

    document.getElementById("artist").textContent = track.artist;
    document.getElementById("title").textContent = track.name;
    currentTrackDuration = track.durationMs;
    currentLyrics = await fetchLyrics(track.name, track.artist, track.album, Math.round(track.durationMs / 1000));

    if (track.albumArt) {
        const img = new Image();
        img.src = track.albumArt;
        img.onload = () => {
            const a = document.getElementById('album-art');
            a.innerHTML = '';
            a.appendChild(img);
        };
    }
}

// for lyrics + progress bar
function renderLoop() {
    const elapsedMs = getEstimatedProgressMs();
    const elapsedSec = elapsedMs / 1000;

    // render lyric text
    if (currentLyrics && currentLyrics.synced) {
        let index = getActiveLineIndex(currentLyrics.lines, elapsedSec);
        
        document.getElementById("lyrics-prev").textContent = currentLyrics.lines[index - 1]?.text || '';
        document.getElementById("lyrics-current").textContent = currentLyrics.lines[index].text;
        document.getElementById("lyrics-next1").textContent = currentLyrics.lines[index + 1]?.text || '';
        document.getElementById("lyrics-next2").textContent = currentLyrics.lines[index + 2]?.text || '';
        
    }  else if (currentLyrics && !currentLyrics.synced && !currentLyrics.instrumental) {
        document.getElementById("lyrics-container").hidden = true;
        document.getElementById("lyrics-plain").hidden = false;
        document.getElementById("lyrics-plain").textContent = currentLyrics.lines.join('\n');
    }
    
    // render progress bar
    const progressPercent = Math.min(100, (elapsedMs / currentTrackDuration) * 100);
    document.getElementById("progress-fill").style.width = progressPercent + '%';

    document.getElementById("time-elapsed").textContent = formatTime(elapsedMs);
    document.getElementById("time-duration").textContent = formatTime(currentTrackDuration);
    requestAnimationFrame(renderLoop);
}

// UTILITY FUNCTIONS
function updateClock() {
    const now = new Date();
    document.getElementById('time').textContent = 
        now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
}

// handle lyrics sizing
let fontSize = 30;
const ACTIVE_SIZE_BOOST = 8; // how much bigger the active line is than the others

function changeSize() {
    fontSize = fontSize >= 46 ? 22 : fontSize + 4;
    
    const lines = document.querySelectorAll(".lyric-line");
    lines.forEach(line => {
        line.style.fontSize = fontSize + 'px';
    });

    document.getElementById("lyrics-current").style.fontSize = (fontSize + ACTIVE_SIZE_BOOST) + 'px';
}


function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ':' + String(seconds).padStart(2, '0');
}

init()