// player.js
import { fetchCurrentlyPlaying } from './spotify.js';
import { getAccessToken, refreshAccessToken } from './auth.js';

let pollTimer = null;
let currentTrack = null;
let onUpdateCallback = null;

async function poll() {
    const accessToken = getAccessToken();

    try {
        const data = await fetchCurrentlyPlaying(accessToken)
        if (data === null) { // nothing playing
            currentTrack = null;
            onUpdateCallback(currentTrack);
            return;
        }

        const track = data.item;
        const trackChanged = !currentTrack || currentTrack.id !== track.id;
        const trackStart = trackChanged ? Date.now() - data.progress_ms : currentTrack.trackStart;

        currentTrack = {
            id: track.id,
            name: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            albumArt: track.album?.images?.[0]?.url,
            durationMs: track.duration_ms,
            trackStart,
        };

        onUpdateCallback(currentTrack);
    } catch (e) {
        if (e.status === 401) {
            const refreshed = await refreshAccessToken();
            if (refreshed) {
                await poll(); // retry once, now with a fresh token
            }
        } else { console.error(e) }
    };
}

export function startPolling(onUpdate) {
    onUpdateCallback = onUpdate;
    poll(); // immediate first call
    pollTimer = setInterval(poll, 8000);
}

export function stopPolling() {
    clearInterval(pollTimer);
}

export function getEstimatedProgressMs() {
    if (!currentTrack) return 0;
    return Date.now() - currentTrack.trackStart;
}

export function getCurrentTrack() {
    return currentTrack;
}