// main.js
import { startOAuth, refreshAccessToken, handleOAuthCallback, getAccessToken } from './auth.js';
import { startPolling, getEstimatedProgressMs } from './player.js';
import { fetchLyrics, getActiveLineIndex } from './lyrics.js';
import { skipSong } from './spotify.js';
import { getActiveUserId, getDisplayName } from './storage.js';

const params = new URLSearchParams(window.location.search);
const isCallback = params.has('access_token') || params.has('error');

let currentLyrics = null;

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
        document.getElementById('result').textContent = JSON.stringify(result);

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
    let elapsedSec = getEstimatedProgressMs() / 1000;
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
        
    }
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

init()