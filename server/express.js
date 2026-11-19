const express = require("express");
const stravaRoutes = require("./routes/strava");
const { stravaWebhookReviver } = require("../utils/stravaHelpers");

function createExpressServer(client) {
  // Express app
  const app = express();
  app.use(express.json({ reviver: stravaWebhookReviver }));

  // any route starting with /strava, hand it off to whatever routes are inside stravaRoutes
  app.use("/strava", stravaRoutes(client));

  return app;
}

module.exports = { createExpressServer };