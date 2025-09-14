const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { stravaFetch } = require("../../services/strava");
const dayjs = require('dayjs');
const advancedFormat = require('dayjs/plugin/advancedFormat');

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
      const formattedDate = dayjs(latest.start_date_local).format("dddd, MMMM D, YYYY [at] hh:mmA");
      const mapUrl = `https://heatmap-external-a.strava.com/tiles/auth/${latest.map.id}/0/0/0.png`;
      console.log(mapUrl);


      //const lastestJsonOutput = "```json\n" + JSON.stringify(latest, null, 2).slice(0, 1900) + "\n```";

      // if there are no activities
      if(!latest) {
        await interaction.editReply("No recent Strava activities found.");
      }

      const exampleEmbed = new EmbedBuilder()
        .setColor('#FC5200')
        .setTitle(`${ latest.name }`)
        .setURL(`https://strava.com/activities/${ latest.id }`)
        .setAuthor({ name: 'Strava API', iconURL: 'https://cdn.brandfetch.io/idTLzKLmej/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668515681500', url: 'https://strava.com' })
        .setDescription(`<@${userId}> on ${formattedDate}`)
        .addFields(
          { name: 'Type', value: `${ latest.sport_type }`, inline: true },
          { name: 'Distance', value: `${ latest.distance }`, inline: true },
          { name: 'Moving Time', value: `${ latest.moving_time }`, inline: true },
          { name: 'Elapsed Time', value: `${ latest.elapsed_time }`, inline: true },
          { name: 'Pace', value: '10m19s/mi', inline: true },
          { name: 'Speed', value: `${ latest.average_speed }`, inline: true },
          { name: 'Elevation', value: `${ latest.total_elevation_gain }`, inline: true },
        )
        .setImage(mapUrl)
        .setAuthor({ name: 'Strava API', iconURL: 'https://cdn.brandfetch.io/idTLzKLmej/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668515681500', url: 'https://strava.com' })
        .setFooter({ text: 'Powered by Strava' });

        await interaction.editReply({ embeds: [exampleEmbed] });
    } catch(err) {
      console.error("Error fetching Strava activity:", err.message);
      console.error("Error fetching Strava activity:", err);
      console.error("Stack trace:", err.stack);
        await interaction.editReply("Could not fetch latest Strava activity");
    }
	},
};

// TODO List
// change exampleEmbed to a real variable name
// update similarly in strava-profile.js
// any image updates that need to be made?
// timezone offset isn't right
// mapUrl is broken, doesn't display anything
// pace needs to be calculated
// everything needs to be calculated, actually.