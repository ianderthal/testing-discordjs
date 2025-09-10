let accessToken = null;
let refreshToken = process.env.STRAVA_REFRESH_TOKEN;

// Refresh strava access token using the refresh token
async function refreshAccessToken() {
  // Always read the current refresh token from process.env
  const currentRefresh = refreshToken || process.env.STRAVA_REFRESH_TOKEN;

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: currentRefresh
    })
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Failed to refresh Strava token: ${res.status} - ${errBody}`);
  }

  const data = await res.json();
  accessToken = data.access_token;
  refreshToken = data.refresh_token;
  return accessToken;
}

// Make a request to Strava API with automatic token refresh
async function stravaFetch(endpoint) {
  if (!accessToken) {
    await refreshAccessToken();
  }

  const res = await fetch(`https://www.strava.com/api/v3/${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  // Retry once if token has expired
  if (res.status === 401) {
    await refreshAccessToken();
    return stravaFetch(endpoint);
  }

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Strava API error: ${res.status} - ${errBody}`);
  }

  return res.json();
}

module.exports = {
  refreshAccessToken,
  stravaFetch
};