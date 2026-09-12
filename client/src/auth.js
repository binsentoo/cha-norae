// auth.js -- manage OAuth flow and in-memory access token
import {
    getOAuthState, setOAuthState, clearOAuthState,
    setActiveUserId, clearActiveUserId,
    setRefreshToken, getRefreshToken,
    setDisplayName, addKnownUserId,
    getActiveUserId,
} from './storage.js';
import { fetchCurrentUser } from './spotify.js'; 

const SCOPES = [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-modify-playback-state',
].join(' ');

let accessToken = null; 

export function startOAuth() {
    const state = crypto.randomUUID();
    setOAuthState(state);

    const params = new URLSearchParams({
        client_id: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: window.location.origin + '/api/callback',
        scope: SCOPES,
        state: state,
    });

    window.location.href = 'https://accounts.spotify.com/authorize?' + params;
    
}

export async function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const returnedState = params.get('state');
    const error = params.get('error');

    const storedState = getOAuthState();
    clearOAuthState(); // single-use, clear regardless of outcome

    if (error) {
        return { success: false, error };
    }

    if (!token || !refreshToken) {
        return { success: false, error: 'missing_tokens' };
    }

    if (!returnedState || returnedState !== storedState) {
        return { success: false, error: 'state_mismatch' };
    }

    accessToken = token;

    let user;
    try {
        user = await fetchCurrentUser(accessToken);
    } catch (e) {
        return { success: false, error: 'user_fetch_error' }
    }

    setRefreshToken(user.id, refreshToken);
    setDisplayName(user.id, user.display_name || user.id);
    addKnownUserId(user.id);
    setActiveUserId(user.id);

    window.history.replaceState({}, '', '/');

    return { success: true, userId: user.id };

}

export function getAccessToken() { 
    return accessToken;
}

export async function refreshAccessToken() {
    const userId = getActiveUserId();
    if (!userId) return false;

    const storedRefreshToken = getRefreshToken(userId);
    if (!storedRefreshToken) return false;

    try {
        const response = await fetch('/api/refresh_token?token=' + encodeURIComponent(storedRefreshToken));
        if (!response.ok) return false;

        const data = await response.json();
        if (!data.access_token) return false;

        accessToken = data.access_token;
        if (data.refresh_token) {
            setRefreshToken(userId, data.refresh_token);
        }
        return true;
    } catch (e) {
        return false;
    }
}

export function logout() {
    clearActiveUserId();
    accessToken = null;
}