let accessToken = null;
let refreshToken = process.env.STRAVA_REFRESH_TOKEN;

// Refresh strava access token using the refresh token
async function refreshAccessToken() {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    })
  });

  if (!res.ok) {
    throw new Error(`Failed to refresh Strava token: ${res.status}`);
  }

  const data = await res.json();
  accessToken = data.access_token;
  refreshToken = data.refresh_token;
  return accessToken;
}

module.exports = { refreshAccessToken };