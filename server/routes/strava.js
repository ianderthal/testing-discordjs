const { createStravaActivityEmbed } = require('../../utils/stravaEmbed')
const { stravaFetch, stravaFetchForAthlete } = require('../../services/strava')
const { profilePictureUrl } = require('../../utils/stravaHelpers')

module.exports = (client) => {
  const router = require("express").Router();

  // Verification handshake (Strava calls this when you first subscribe)
  router.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = process.env.STRAVA_VERIFY_TOKEN;

    if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
      console.log("Strava webhook verified!");
      res.json({ "hub.challenge": req.query['hub.challenge'] });
    } else {
      console.error("Strava webhook verification failed.");
      res.status(403).send("Verification failed");
    }
  })

  // Express Webhook Endpoint
  router.post("/webhook", (req, res) => {
    console.log("Webhook event:", req.body);

    // Immediately acknowledge Strava
    res.sendStatus(200);

    if (req.body.object_type === "activity" && req.body.aspect_type === "create") {
      const activityId = req.body.object_id;
      const ownerStravaId = req.body.owner_id;

      const { getAthleteByStravaId } = require('../../services/database');
      const athlete = getAthleteByStravaId(ownerStravaId);
      if (!athlete) {
        console.log(`Webhook received for unknown athlete ${ownerStravaId} - ignoring`);
        return;
      }

      // Background async function
      (async () => {
        const maxRetries = 10;
        let delay = 2000; // initial 2s
        let activity;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            activity = await stravaFetchForAthlete(ownerStravaId, `activities/${activityId}`);
            console.log(`Successfully fetched activity ${activityId} on attempt ${attempt}`);
            break; // success
          } catch (err) {
            if (err.message.includes("404") && attempt < maxRetries) {
              console.log(
                `Activity ${activityId} not ready yet (attempt ${attempt}), retrying in ${delay / 1000}s...`
              );
              await new Promise((res) => setTimeout(res, delay));
              delay = Math.min(delay * 2, 90000); // exponential backoff capped at 90s
            } else {
              console.error(`Failed to fetch activity ${activityId}:`, err);
              return; // give up
            }
          }
        }

        if (!activity) return; // all retries failed

        // Refresh the athlete's name and picture so a changed Strava photo
        // doesn't leave a dead URL in the embed. Fall back to the stored values.
        let athleteName = athlete.athlete_name;
        let profilePicture = athlete.profile_picture;
        try {
          const { updateAthleteProfile } = require('../../services/database');
          const profile = await stravaFetchForAthlete(ownerStravaId, 'athlete');
          athleteName = `${profile.firstname} ${profile.lastname}`;
          profilePicture = profilePictureUrl(profile);
          updateAthleteProfile(ownerStravaId, athleteName, profilePicture);
        } catch (err) {
          console.error(`Failed to refresh profile for athlete ${ownerStravaId}, using stored values:`, err.message);
        }

        try {
          const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID);
          const embed = createStravaActivityEmbed(activity, {
            athleteName,
            profilePicture,
          });
          await channel.send({ embeds: [embed] });
          console.log(`Discord message sent for activity ${activityId}`);
        } catch (err) {
          console.error("Failed to send Discord message:", err);
        }
      })();
    }
  });

  return router;
};