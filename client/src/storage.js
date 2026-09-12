// storage.js -- handles localStorage reads/writes

const KEYS = {
    ACTIVE_USER: 'sp_active_user',
    KNOWN_USERS: 'sp_users',
    OAUTH_STATE: 'sp_oauth_state',
    REFRESH_TOKEN: (userId) => `sp_refresh_token:${userId}`,
    DISPLAY_NAME: (userId) => `sp_display_name:${userId}`,
};

// -- ACTIVE USER ID --
export function getActiveUserId() {
    return localStorage.getItem(KEYS.ACTIVE_USER);
}

export function setActiveUserId(id) {
    localStorage.setItem(KEYS.ACTIVE_USER, id);
}

export function clearActiveUserId() { // logout (keeps token stored)
    localStorage.removeItem(KEYS.ACTIVE_USER);
}

// -- REFRESH TOKEN --
export function getRefreshToken(userId) {
    return localStorage.getItem(KEYS.REFRESH_TOKEN(userId));
}

export function setRefreshToken(userId, token) {
    localStorage.setItem(KEYS.REFRESH_TOKEN(userId), token);
}

export function forgetUser(userId) { // removes refresh_token and display_name from known list
    localStorage.removeItem(KEYS.REFRESH_TOKEN(userId));
    localStorage.removeItem(KEYS.DISPLAY_NAME(userId));
    const known = getKnownUserIds();
    const filteredKnown = known.filter(knownId => knownId !== userId);
    localStorage.setItem(KEYS.KNOWN_USERS, JSON.stringify(filteredKnown));
}

// -- DISPLAY NAME --
export function getDisplayName(userId) {
    return localStorage.getItem(KEYS.DISPLAY_NAME(userId));
}

export function setDisplayName(userId, name) {
    localStorage.setItem(KEYS.DISPLAY_NAME(userId), name);
}

// -- KNOWN USERS --
export function getKnownUserIds() {
    const raw = localStorage.getItem(KEYS.KNOWN_USERS);
    return raw ? JSON.parse(raw) : [];
}

export function addKnownUserId(id) {
    const known = getKnownUserIds();
    if (!known.includes(id)) {
        known.push(id);
        localStorage.setItem(KEYS.KNOWN_USERS, JSON.stringify(known));
    }
}

// -- OAuth state --
export function getOAuthState() {
    return localStorage.getItem(KEYS.OAUTH_STATE);
}

export function setOAuthState(state) {
    localStorage.setItem(KEYS.OAUTH_STATE, state);
}

export function clearOAuthState() {
    localStorage.removeItem(KEYS.OAUTH_STATE)
}