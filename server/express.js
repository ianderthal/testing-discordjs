const express = require("express");
const stravaRoutes = require("./routes/strava");

function createExpressServer(client) {
  // Express app
  const app = express();
  app.use(express.json());

  // any route starting with /strava, hand it off to whatever routes are inside stravaRoutes
  app.use("/strava", stravaRoutes(client));

  return app;
}

module.exports = { createExpressServer };