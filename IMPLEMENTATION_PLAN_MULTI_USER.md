# Multi-Athlete Strava Support Plan

## Overview
Enable the Discord bot to handle webhook events from multiple Strava athletes by storing athlete credentials in SQLite and routing webhook events based on `owner_id`.

## Files to Modify/Create

| File | Action |
|------|--------|
| `package.json` | Add `better-sqlite3` dependency |
| `services/database.js` | **Create** - SQLite setup + athlete CRUD |
| `services/strava.js` | Add `stravaFetchForAthlete()` function |
| `server/routes/strava.js` | Use `owner_id` to lookup athlete |
| `utils/stravaEmbed.js` | Accept `athleteName`, remove hardcoded image |
| `index.js` | Initialize database on startup |
| `scripts/manage-athletes.js` | **Create** - CLI for adding athletes |
| `.gitignore` | Add `data/*.db` |

---

## Implementation Steps

### Step 1: Add SQLite dependency
```bash
npm install better-sqlite3
```

### Step 2: Create database service (`services/database.js`)

Schema:
```sql
CREATE TABLE IF NOT EXISTS athletes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  strava_athlete_id INTEGER UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at INTEGER,
  athlete_name TEXT,
  profile_picture TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

Exports:
- `initDatabase()` - Create tables
- `getAthleteByStravaId(stravaId)` - Lookup by Strava ID
- `getAllAthletes()` - List all
- `addAthlete(data)` - Insert new athlete
- `updateAthleteTokens(stravaId, accessToken, refreshToken, expiresAt)` - Update tokens
- `deleteAthlete(stravaId)` - Remove athlete

Database file: `./data/athletes.db`

### Step 3: Initialize database in `index.js`
```javascript
const { initDatabase } = require('./services/database');
initDatabase();
```

### Step 4: Add per-athlete functions to `services/strava.js`

New functions (keep existing ones for backward compatibility):
- `stravaFetchForAthlete(stravaAthleteId, endpoint)` - API call using athlete's token
- `refreshAccessTokenForAthlete(athlete)` - Refresh and update DB

Logic:
1. Lookup athlete from DB
2. Check if token expired (`token_expires_at`)
3. Refresh if needed, update DB
4. Make API call
5. Handle 401 by refreshing and retrying

### Step 5: Update webhook handler (`server/routes/strava.js`)

Current code (line 28):
```javascript
const activityId = req.body.object_id;
```

Add:
```javascript
const ownerStravaId = req.body.owner_id;
const athlete = getAthleteByStravaId(ownerStravaId);
if (!athlete) {
  console.log(`Unknown athlete ${ownerStravaId}, ignoring`);
  return;
}
```

Replace `stravaFetch()` with `stravaFetchForAthlete(ownerStravaId, ...)`.

Pass athlete info to embed:
```javascript
const embed = createStravaActivityEmbed(activity, {
  athleteName: athlete.athlete_name,
  profilePicture: athlete.profile_picture
});
```

### Step 6: Update embed (`utils/stravaEmbed.js`)

- Accept `athleteName` and `profilePicture` in options
- Use `athleteName` in description: `"${athleteName} on ${formattedDate}"`
- Remove hardcoded `.setImage()` URL, use `profilePicture` if provided

### Step 7: Create CLI script (`scripts/manage-athletes.js`)

Usage:
```bash
# Add athlete (fetches profile automatically)
node scripts/manage-athletes.js add --refresh-token "abc123..."

# List athletes
node scripts/manage-athletes.js list

# Remove athlete
node scripts/manage-athletes.js remove --strava-id 12345
```

When adding:
1. Call Strava token refresh to get access token + expiry
2. Fetch `/athlete` endpoint to get name + profile picture
3. Store all in database

### Step 8: Update `.gitignore`
Add:
```
data/*.db
```

---

## Key Design Decisions

1. **Shared app credentials**: `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET` remain in env vars (one Strava app for all athletes)

2. **Per-athlete tokens**: Each athlete has their own `access_token` and `refresh_token` stored in SQLite

3. **Webhook routing**: Use `owner_id` from webhook payload to identify which athlete's tokens to use

4. **Backward compatibility**: Keep existing `stravaFetch()` working with env vars for slash commands

5. **Manual registration**: Admin manually obtains refresh token via OAuth, then uses CLI to add athlete
