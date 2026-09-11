// api/refresh_token.js
import { exchangeToken } from './_utils.js';

export default async function handler(req, res) {
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
}
