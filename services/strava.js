const { getAllAthletes, updateAthleteTokens } = require('./database');

let accessToken = null;
let currentAthleteId = null;

// Refresh strava access token using the refresh token
async function refreshAccessToken() {
  const athlete = getAllAthletes()[0];
  if (!athlete) throw new Error('No athletes in db. Run: node scripts/manage-athletes.js seed');

  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: athlete.refresh_token
    })
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Failed to refresh Strava token: ${res.status} - ${errBody}`);
  }

  const data = await res.json();
  accessToken = data.access_token;
  currentAthleteId = athlete.strava_athlete_id;

  // After successful refresh, save new tokens back to the DB
  updateAthleteTokens(athlete.strava_athlete_id, data.access_token, data.refresh_token, data.expires_at);

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
  stravaFetch
};