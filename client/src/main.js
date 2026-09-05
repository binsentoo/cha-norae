// main.js
import { startOAuth, handleOAuthCallback, getAccessToken } from './auth.js';
import { startPolling } from './player.js';

const params = new URLSearchParams(window.location.search);
const isCallback = params.has('access_token') || params.has('error');
 
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

function handleTrackUpdate(track) {
    if (track === null) {
        document.getElementById("current-track").textContent = "no song is playing rn"
    }

    document.getElementById("current-track").textContent = track.artist + track.name
}


init()