// index.js - handle API endpoints
require('dotenv').config();
const { error } = require('console');
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000

// refresh token lasts 180 days
async function exchangeToken(grantParams) {
    const body = {
        ...grantParams,
        client_id: process.env.SPOTIFY_CLIENT_ID,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET,
    };

    const params = new URLSearchParams(body);

    const r = await fetch("https://accounts.spotify.com/api/token", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString()
    });

    if (!r.ok) {
        const errorBody = await r.text();
        console.log('Token exchange error:', errorBody);
        throw new Error("Token exchange failed");
    }

    return r.json();
}   

app.get('/api/callback', async (req, res) => {
    try {
        const code = req.query.code || null;
        const state = req.query.state || null;
        const error = req.query.error || null;
        
        if (error) {
            // redirect to frontend
            return res.redirect(`/?error=${encodeURIComponent(error)}`);
        }

        if (!code) {
            return res.redirect('/?error=missing_code')
        }

        const tokens = await exchangeToken({
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.REDIRECT_URI
        });
        
        const params = new URLSearchParams({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            state: state || '',
        });

        res.redirect(`/?${params.toString()}`);
    } catch (e) {
        res.redirect('/?error=token_exchange_failed')
    }
});

app.get('/api/refresh_token', async (req, res) => {
    try {
        const refreshToken = req.query.token || null;

        if (!refreshToken) {
            return res.status(400).json({ error: 'missing_refresh_token' });
        }

        const tokens = await exchangeToken({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        });

        res.json(tokens);
    } catch (e) {
        res.status(400).json({ error: 'refresh_failed'});
    }
});

// catch-all
app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
 
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});