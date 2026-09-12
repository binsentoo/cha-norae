// api/callback.js -- vercel serverless function, default handler
import { exchangeToken } from './_utils.js';

export default async function handler(req, res) {
    try {
        const code = req.query.code || null;
        const state = req.query.state || null;
        const error = req.query.error || null;

        if (error) {
            return res.redirect(`/?error=${encodeURIComponent(error)}`);
        }

        if (!code) {
            return res.redirect('/?error=missing_code');
        }

        const tokens = await exchangeToken({
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.REDIRECT_URI,
        });

        const params = new URLSearchParams({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            state: state || '',
        });

        res.redirect(`/#${params.toString()}`);
    } catch (e) {
        console.error('Spotify token exchange failed details:', e.response?.data || e.message || e);
        res.redirect('/?error=token_exchange_failed');
    }
}