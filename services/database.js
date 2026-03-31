const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data/athletes.db');

let db;

function initDatabase() {
  const dir = path.dirname(DB_PATH);
  if(!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);

  db.exec(`
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
  )
  `);

  console.log('Database initialized');
}

function getAthleteByStravaId(stravaId) {
    return db.prepare('SELECT * FROM athletes WHERE strava_athlete_id = ?').get(stravaId);
  }

  function getAllAthletes() {
    return db.prepare('SELECT * FROM athletes').all();
  }

  function addAthlete({ strava_athlete_id, access_token, refresh_token, token_expires_at, athlete_name, profile_picture }) {
    return db.prepare(`
      INSERT INTO athletes (strava_athlete_id, access_token, refresh_token, token_expires_at, athlete_name, profile_picture)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(strava_athlete_id, access_token, refresh_token, token_expires_at, athlete_name, profile_picture);
  }

  function updateAthleteTokens(stravaId, accessToken, refreshToken, expiresAt) {
    return db.prepare(`
      UPDATE athletes
      SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE strava_athlete_id = ?
    `).run(accessToken, refreshToken, expiresAt, stravaId);
  }

  module.exports = { initDatabase, getAthleteByStravaId, getAllAthletes, addAthlete, updateAthleteTokens };