const { EmbedBuilder } = require('discord.js');
const { metersToMiles, secondsToMinutes, pace, formatActivityDate } = require("./stravaHelpers")

const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const utc = require('dayjs/plugin/utc');

dayjs.extend(utc);
dayjs.extend(advancedFormat);

function createStravaActivityEmbed(activity, options = {}) {

  const formattedDate = formatActivityDate(activity);
  const miles = metersToMiles(activity.distance).toFixed(2);
  const minutes = secondsToMinutes(activity.moving_time);
  const runPace = pace(activity.distance, activity.moving_time);
  const { userId } = options;

  // Choose what goes into embed
  const descriptionText = userId ? `<@${userId}> on ${formattedDate}` : `Activity on ${formattedDate}`;

  return new EmbedBuilder()
    .setColor('#FC5200')
    .setTitle(`${ activity.name }`)
    .setURL(`https://strava.com/activities/${ activity.id }`)
    .setAuthor({ name: 'Strava API', iconURL: 'https://cdn.brandfetch.io/idTLzKLmej/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668515681500', url: 'https://strava.com' })
    .setDescription(descriptionText)
    .addFields(
      { name: 'Distance:', value: `${ miles } mi`, inline: true },
      { name: 'Duration:', value: `${ minutes }`, inline: true },
      { name: 'Pace:', value: runPace, inline: true }
    )
    .setImage('https://dgalywyr863hv.cloudfront.net/pictures/athletes/17866718/5098592/3/medium.jpg')
    .setAuthor({ name: 'Strava API', iconURL: 'https://cdn.brandfetch.io/idTLzKLmej/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668515681500', url: 'https://strava.com' })
    .setFooter({ text: 'Powered by Strava' });
}

module.exports = { createStravaActivityEmbed };
