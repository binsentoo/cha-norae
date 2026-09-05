// spotify.js — calls to Spotify's actual Web API

export async function fetchCurrentUser(accessToken) {
    const response = await fetch('https://api.spotify.com/v1/me', {
        headers: { Authorization: 'Bearer ' + accessToken }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch current user');
    }

    return response.json();
}

export async function fetchCurrentlyPlaying(accessToken) {
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
        headers: { Authorization: 'Bearer ' + accessToken }
    });

    if (response.status === 204) { // no song currently playing
        return null;
    }

    if (!response.ok) {
        err.status = response.status;
        throw err;
    }

    return response.json();
}