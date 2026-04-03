require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const { initDatabase, addAthlete, getAllAthletes } = require('../services/database');

const command = process.argv[2];

async function seed() {
  const refreshToken = process.env.STRAVA_REFRESH_TOKEN;
  if (!refreshToken) throw new Error('STRAVA_REFRESH_TOKEN not found in env');

  // Exchange refresh token for a valid access token
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token refresh failed: ${tokenRes.status} - ${err}`);
  }

  const tokenData = await tokenRes.json();

  // Fetch athlete profile
  const athleteRes = await fetch('https://www.strava.com/api/v3/athlete', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!athleteRes.ok) {
    const err = await athleteRes.text();
    throw new Error(`Failed to fetch athlete: ${athleteRes.status} - ${err}`);
  }

  const athlete = await athleteRes.json();

  addAthlete({
    strava_athlete_id: athlete.id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    token_expires_at: tokenData.expires_at,
    athlete_name: `${athlete.firstname} ${athlete.lastname}`,
    profile_picture: athlete.profile,
  });

  console.log(`Added athlete: ${athlete.firstname} ${athlete.lastname} (Strava ID: ${athlete.id})`);
}

function list() {
  const athletes = getAllAthletes();
  if (athletes.length === 0) {
    console.log('No athletes in database.');
    return;
  }
  for (const a of athletes) {
    const expiry = new Date(a.token_expires_at * 1000).toLocaleString();
    console.log(`- ${a.athlete_name} | Strava ID: ${a.strava_athlete_id} | Token expires: ${expiry}`);
  }
}

initDatabase();

if (command === 'seed') {
  seed().catch(err => { console.error(err.message); process.exit(1); });
} else if (command === 'list') {
  list();
} else {
  console.log('Usage: node scripts/manage-athletes.js <seed|list>');
}