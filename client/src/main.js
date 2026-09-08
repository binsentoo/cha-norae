// main.js
import { startOAuth, handleOAuthCallback, getAccessToken } from './auth.js';
import { startPolling, getEstimatedProgressMs } from './player.js';
import { fetchLyrics, getActiveLineIndex } from './lyrics.js';

const params = new URLSearchParams(window.location.search);
const isCallback = params.has('access_token') || params.has('error');

let currentLyrics = null;

async function init() {
    if (isCallback) {
        const result = await handleOAuthCallback();
        document.getElementById('result').textContent = JSON.stringify(result);

        if (result.success) {
            startPolling(handleTrackUpdate);
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

    document.getElementById("current-track").textContent = track.artist + " - " + track.name;
    currentLyrics = await fetchLyrics(track.name, track.artist, track.album, Math.round(track.durationMs / 1000));
    document.getElementById("lyrics").textContent = JSON.stringify(currentLyrics);
}


// for lyrics + progress bar
function renderLoop() {
    let elapsedSec = getEstimatedProgressMs() / 1000;
    if (currentLyrics && currentLyrics.synced) {
        let index = getActiveLineIndex(currentLyrics.lines, elapsedSec);
        const prevLine = currentLyrics.lines[index - 1]?.text || '';
        const currLine = currentLyrics.lines[index].text;
        const nextLine = currentLyrics.lines[index + 1]?.text || '';
        document.getElementById("lyrics").textContent = prevLine + '\n' + currLine + '\n' + nextLine;
    }
    requestAnimationFrame(renderLoop);
}

requestAnimationFrame(renderLoop);

init()