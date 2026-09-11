// main.js
import { startOAuth, refreshAccessToken, handleOAuthCallback, getAccessToken } from './auth.js';
import { startPolling, getEstimatedProgressMs } from './player.js';
import { fetchLyrics, getActiveLineIndex } from './lyrics.js';
import { skipSong } from './spotify.js';
import { getActiveUserId, getDisplayName } from './storage.js';

const params = new URLSearchParams(window.location.search);
const isCallback = params.has('access_token') || params.has('error');

let currentLyrics = null;
let currentTrackDuration = null;

function enterApp() {
    startPolling(handleTrackUpdate);
    document.getElementById("connect-screen").hidden = true;
    document.getElementById("player-screen").hidden = false;
    document.getElementById("display-name").textContent = getDisplayName(getActiveUserId());
    document.getElementById("skip-btn").addEventListener('click', async () => {
        const accessToken = getAccessToken();
        try {
            await skipSong(accessToken);
        } catch (e) {
            if (e.status === 401) {
                const refreshed = await refreshAccessToken();
                if (refreshed) {
                    await skipSong(getAccessToken()); // retry with fresh token
                }
            }
        }
    });
}

async function init() {
    if (isCallback) {
        const result = await handleOAuthCallback();

        if (result.success) {
            enterApp();
        }
    } else if (getActiveUserId()) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            enterApp();
        } else {
            document.getElementById("connect-btn").addEventListener('click', startOAuth);
        }
    } else {
        document.getElementById("connect-btn").addEventListener('click', startOAuth);
    }
}

async function handleTrackUpdate(track) {
    if (track === null) {
        document.getElementById("current-track").textContent = "no song is playing rn";
        return;
    }

    document.getElementById("artist").textContent = track.artist;
    document.getElementById("title").textContent = track.name;
    currentTrackDuration = track.durationMs;
    currentLyrics = await fetchLyrics(track.name, track.artist, track.album, Math.round(track.durationMs / 1000));
    //document.getElementById("lyrics").textContent = currentLyrics.lines;

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
    let elapsedSec = elapsedMs / 1000;
    if (currentLyrics && currentLyrics.synced) {
        let index = getActiveLineIndex(currentLyrics.lines, elapsedSec);
        const prevLine = currentLyrics.lines[index - 1]?.text || '';
        const currLine = currentLyrics.lines[index].text;
        const nextLine = currentLyrics.lines[index + 1]?.text || '';
        const nextLine2 = currentLyrics.lines[index + 2]?.text || '';

        document.getElementById("lyrics-prev").textContent = prevLine;
        document.getElementById("lyrics-current").textContent = currLine;
        document.getElementById("lyrics-next1").textContent = nextLine;
        document.getElementById("lyrics-next2").textContent = nextLine2;
        
    }  else if (currentLyrics && !currentLyrics.synced && !currentLyrics.instrumental) {
        document.getElementById("lyrics-container").hidden = true;
        document.getElementById("lyrics-plain").hidden = false;
        document.getElementById("lyrics-plain").textContent = currentLyrics.lines.join('\n');
    }
    
    const progressPercent = Math.min(100, (elapsedMs / currentTrackDuration) * 100);
    document.getElementById("progress-fill").style.width = progressPercent + '%';

    document.getElementById("time-elapsed").textContent = formatTime(elapsedMs);
    document.getElementById("time-duration").textContent = formatTime(currentTrackDuration);
    requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);


function updateClock() {
    const now = new Date();
    document.getElementById('time').textContent = 
        now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
}

updateClock();
setInterval(updateClock, 10000); // checks every 10 seconds

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

document.getElementById("change-size").addEventListener('click', changeSize);

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return minutes + ':' + String(seconds).padStart(2, '0');
}

init()