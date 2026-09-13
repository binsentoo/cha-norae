// lyrics.js — fetches and parses lyrics from LRCLib

export async function fetchLyrics(title, artist, album, durationSec) {
    // first api call (get lyrics)
    let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    if (album) url += `&album_name=${encodeURIComponent(album)}`;
    if (durationSec) url += `&duration=${durationSec}`;

    const response = await fetch(url);

    if (response.ok) {
        const data = await response.json();

        if (data.instrumental) {
            return { instrumental: true };
        }

        if (data.syncedLyrics) {
            return { synced: true, lines: parseLRC(data.syncedLyrics) };
        } else if (data.plainLyrics) {
            return { synced: false, lines: data.plainLyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('[')) };
        } else {
            return null; // no lyrics field at all, and not instrumental
        }
    }

    // second api call (search lyrics, backup)
    let url2 = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    if (album) url2 += `&album_name=${encodeURIComponent(album)}`;
    
    const response2 = await fetch(url2);

    if (response2.ok) {
        const results = await response2.json();

        if (results.length === 0) {
            return null; // no lyrics found at all
        }

        const data = results[0]; // TODO: temp fix

        if (data.instrumental) {
            return { instrumental: true };
        } 

        if (data.syncedLyrics) {
            return { synced: true, lines: parseLRC(data.syncedLyrics) };
        } else if (data.plainLyrics) {
            return { synced: false, lines: data.plainLyrics.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('[')) };
        } else {
            return null; // no lyrics field at all, and not instrumental
        }
    }

    return null;
}

export function getActiveLineIndex(syncedLines, elapsedSec) {
    // only called when lines are synced — returns the index of the currently active line
    let idx = 0;
    for (let i = 0; i < syncedLines.length; i++) {
        if (syncedLines[i].time <= elapsedSec) idx = i;
    }
    return idx
}

function parseLRC(str) {
    const lines = []
    str.split('\n').forEach(line => {
        const m = line.match(/^\[(\d+):(\d+\.\d+)\](.*)/);
        if (m) {
            const minutes = m[1];
            const seconds = m[2];
            const text = m[3].trim();

            let duration = parseInt(minutes) * 60 + parseFloat(seconds);
            if (text) lines.push({time: duration, text});
        }
    });
    return lines;
}

// helper function to priortize picking language in original script
function isLatin(str) {
    const latinChars = (str.match(/[a-zA-Z]/g) || []).length;
    return latinChars / str.length > 0.6;
}

function hasNonLatin(str) {
    return /[\u0080-\uFFFF]/.test(str);
}