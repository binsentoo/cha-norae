// api/_utils.js — shared helper, imported by callback.js and refresh_token.js

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

// refresh token lasts 180 days
export async function exchangeToken(bodyParams) {
    const body = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        ...bodyParams,
    });
 
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });
 
    if (!response.ok) {
        throw new Error(`Spotify token exchange failed: ${response.status}`);
    }
 
    return response.json();
}
 