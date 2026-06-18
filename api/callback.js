export default async function handler(req, res) {
  const { code, error } = req.query;
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
  const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  const REDIRECT_URI = `https://${req.headers.host}/api/callback`;

  if (error) {
    return res.redirect(`/?error=${error}`);
  }

  try {
    const r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await r.json();

    if (!data.refresh_token) {
      return res.redirect(`/?error=no_refresh_token`);
    }

    // Pass tokens back to the app via URL fragment (never hits server logs)
    res.redirect(`/?access_token=${data.access_token}&refresh_token=${data.refresh_token}&expires_in=${data.expires_in}`);
  } catch (e) {
    res.redirect(`/?error=${e.message}`);
  }
}
