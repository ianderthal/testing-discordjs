  require('dotenv').config({ path: '.env.development' });
  const { initDatabase, getAllAthletes } = require('./services/database');

  initDatabase();
  console.log('Athletes in DB:', getAllAthletes());