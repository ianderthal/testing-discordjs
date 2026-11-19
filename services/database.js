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
    strava_athlete_id TEXT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at INTEGER,
    athlete_name TEXT,
    profile_picture TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
  `);

  migrateStravaAthleteIdToText();

  console.log('Database initialized');
}

// Strava athlete IDs may become 64-bit after June 1, 2027, which JavaScript
// numbers can't hold exactly, so they're stored as TEXT. Databases created
// before this change have an INTEGER column; rebuild the table to convert it.
function migrateStravaAthleteIdToText() {
  const column = db.prepare('PRAGMA table_info(athletes)').all()
    .find(c => c.name === 'strava_athlete_id');
  if (!column || column.type.toUpperCase() === 'TEXT') return;

  db.transaction(() => {
    db.exec(`
      CREATE TABLE athletes_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strava_athlete_id TEXT UNIQUE NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      token_expires_at INTEGER,
      athlete_name TEXT,
      profile_picture TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
      INSERT INTO athletes_new (id, strava_athlete_id, access_token, refresh_token, token_expires_at, athlete_name, profile_picture, created_at, updated_at)
        SELECT id, CAST(strava_athlete_id AS TEXT), access_token, refresh_token, token_expires_at, athlete_name, profile_picture, created_at, updated_at
        FROM athletes;
      DROP TABLE athletes;
      ALTER TABLE athletes_new RENAME TO athletes;
    `);
  })();

  console.log('Migrated athletes.strava_athlete_id to TEXT');
}

function getAthleteByStravaId(stravaId) {
    return db.prepare('SELECT * FROM athletes WHERE strava_athlete_id = ?').get(String(stravaId));
  }

  function getAllAthletes() {
    return db.prepare('SELECT * FROM athletes').all();
  }

  function addAthlete({ strava_athlete_id, access_token, refresh_token, token_expires_at, athlete_name, profile_picture }) {
    return db.prepare(`
      INSERT INTO athletes (strava_athlete_id, access_token, refresh_token, token_expires_at, athlete_name, profile_picture)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(String(strava_athlete_id), access_token, refresh_token, token_expires_at, athlete_name, profile_picture);
  }

  function updateAthleteTokens(stravaId, accessToken, refreshToken, expiresAt) {
    return db.prepare(`
      UPDATE athletes
      SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE strava_athlete_id = ?
    `).run(accessToken, refreshToken, expiresAt, String(stravaId));
  }

  module.exports = { initDatabase, getAthleteByStravaId, getAllAthletes, addAthlete, updateAthleteTokens };