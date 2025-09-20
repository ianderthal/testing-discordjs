const embedBuilder = require('discord.js');
const { metersToMiles, secondsToMinutes, pace, formatActivityDate } = require("./stravaHelpers")

//latest or activity to pass in?
function createStravaActivityEmbed(activity) {

  //latest or activity?
  const formattedDate = formatActivityDate(latest);
  const miles = metersToMiles(latest.distance).toFixed(2);
  const minutes = secondsToMinutes(latest.moving_time);
  const runPace = pace(latest.distance, latest.moving_time);

  return new EmbedBuilder()

}

module.exports = { createStravaActivityEmbed };


/*
- get stravaEmbed to work with the webhook first since we can keep it separate and make it from scratch
- then update the slash command to use the stravaEmbed
*/