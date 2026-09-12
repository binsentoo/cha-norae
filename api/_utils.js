// api/_utils.js — shared helper, imported by callback.js and refresh_token.js

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// refresh token lasts 180 days
export async function exchangeToken(formParams) {
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
        },
        body: new URLSearchParams(formParams)
    });

    if (!response.ok) {
        throw new Error(`Spotify token exchange failed: ${response.status}`);
    }

    return response.json();
}
 