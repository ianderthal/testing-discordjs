const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { stravaFetch } = require("../../services/strava");
const { metersToMiles, secondsToMinutes, pace, formatActivityDate } = require("../../utils/stravaHelpers")

const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');
const utc = require('dayjs/plugin/utc');

dayjs.extend(utc);
dayjs.extend(advancedFormat);

module.exports = {
  category: 'strava',
  cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('strava-last-activity')
		.setDescription('grab latest strava activity'),
	async execute(interaction) {
    await interaction.deferReply();

    try {
      // Fetch the most recent activity
      const activities = await stravaFetch("athlete/activities?per_page=1");
      const latest = activities[0];

      // Pick and choose what goes into embed
      const userId = interaction.user.id;

      // Calculate and format
      const formattedDate = formatActivityDate(latest);
      const miles = metersToMiles(latest.distance).toFixed(2);
      const minutes = secondsToMinutes(latest.moving_time);
      const runPace = pace(latest.distance, latest.moving_time);

      // if there are no activities
      if(!latest) {
        await interaction.editReply("No recent Strava activities found.");
      }

      const activityEmbed = new EmbedBuilder()
        .setColor('#FC5200')
        .setTitle(`${ latest.name }`)
        .setURL(`https://strava.com/activities/${ latest.id }`)
        .setAuthor({ name: 'Strava API', iconURL: 'https://cdn.brandfetch.io/idTLzKLmej/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668515681500', url: 'https://strava.com' })
        .setDescription(`<@${userId}> on ${formattedDate}`)
        .addFields(
          { name: 'Distance:', value: `${ miles } mi`, inline: true },
          { name: 'Duration:', value: `${ minutes } min`, inline: true },
          { name: 'Pace:', value: runPace, inline: true }
        )
        .setImage('https://dgalywyr863hv.cloudfront.net/pictures/athletes/17866718/5098592/3/medium.jpg')
        .setAuthor({ name: 'Strava API', iconURL: 'https://cdn.brandfetch.io/idTLzKLmej/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668515681500', url: 'https://strava.com' })
        .setFooter({ text: 'Powered by Strava' });

        await interaction.editReply({ embeds: [activityEmbed] });
    } catch(err) {
      console.error("Error fetching Strava activity:", err.message);
      console.error("Error fetching Strava activity:", err);
      console.error("Stack trace:", err.stack);
        await interaction.editReply("Could not fetch latest Strava activity");
    }
	},
};