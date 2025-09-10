const dotenv = require("dotenv");
const { stravaFetch } = require("./services/strava");

const env = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${env}` });

(async () => {
  try {
    console.log("CLIENT_ID:", process.env.STRAVA_CLIENT_ID);
    console.log("CLIENT_SECRET set?", !!process.env.STRAVA_CLIENT_SECRET);
    console.log("REFRESH_TOKEN (first 8):", process.env.STRAVA_REFRESH_TOKEN?.slice(0, 8));

    // Example 1: Get your athlete profile
    const profile = await stravaFetch("athlete");
    console.log("Athlete profile:", profile);

    // Example 2: Get your latest activity
    const activities = await stravaFetch("athlete/activities?per_page=1");
    console.log("Latest activity:", activities[0]);

  } catch (err) {
    console.error("Error testing stravaFetch:", err.message);
  }
})();
