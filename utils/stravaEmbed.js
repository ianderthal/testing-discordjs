const { EmbedBuilder } = require('discord.js');
const { metersToMiles, metersToFormatted, secondsToMinutes, pace, pacePer500m, formatActivityDate } = require("./stravaHelpers")

const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const utc = require('dayjs/plugin/utc');

dayjs.extend(utc);
dayjs.extend(advancedFormat);

const ROWING_TYPES = ['Rowing', 'VirtualRow'];
const DURATION_ONLY_TYPES = ['Tennis'];

// Pick the stat fields to display based on the activity's sport type
function getActivityFields(activity) {
  const sportType = activity.sport_type || activity.type;
  const duration = secondsToMinutes(activity.moving_time);

  // No meaningful distance or pace for these, so only show duration.
  // Use elapsed_time since moving_time drops the time spent standing between points.
  if (DURATION_ONLY_TYPES.includes(sportType)) {
    return [
      { name: 'Duration:', value: secondsToMinutes(activity.elapsed_time), inline: true }
    ];
  }

  if (ROWING_TYPES.includes(sportType)) {
    return [
      { name: 'Distance:', value: metersToFormatted(activity.distance), inline: true },
      { name: 'Duration:', value: duration, inline: true },
      { name: 'Split:', value: pacePer500m(activity.distance, activity.moving_time), inline: true }
    ];
  }

  // Default (running and everything else)
  return [
    { name: 'Distance:', value: `${ metersToMiles(activity.distance).toFixed(2) } mi`, inline: true },
    { name: 'Duration:', value: duration, inline: true },
    { name: 'Pace:', value: pace(activity.distance, activity.moving_time), inline: true }
  ];
}

function createStravaActivityEmbed(activity, options = {}) {

  const formattedDate = formatActivityDate(activity);
  const { userId, athleteName, profilePicture } = options;

  // Choose what goes into embed
  const descriptionText = userId ? `<@${userId}> on ${formattedDate}` : athleteName ? `${athleteName} on ${formattedDate}` : `Activity on ${formattedDate}`;

  return new EmbedBuilder()
    .setColor('#FC5200')
    .setTitle(`${ activity.name }`)
    .setURL(`https://strava.com/activities/${ activity.id }`)
    .setDescription(descriptionText)
    .addFields(...getActivityFields(activity))
    .setImage(profilePicture || null)
    .setAuthor({ name: 'Strava API', iconURL: 'https://cdn.brandfetch.io/idTLzKLmej/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668515681500', url: 'https://strava.com' })
    .setFooter({ text: 'Powered by Strava' });
}

module.exports = { createStravaActivityEmbed };
