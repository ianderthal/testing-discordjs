const { SlashCommandBuilder } = require('discord.js');
const { stravaFetch } = require("../../services/strava");
const { createStravaActivityEmbed } = require('../../utils/stravaEmbed');

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
      const activity = activities[0];

      // if there are no activities
      if(!activity) {
        await interaction.editReply("No recent Strava activities found.");
      }

      const activityEmbed = createStravaActivityEmbed(activity, {
        userId: interaction.user.id
      });

      await interaction.editReply({ embeds: [activityEmbed] });
    } catch(err) {
      console.error("Error fetching Strava activity:", err.message);
      console.error("Error fetching Strava activity:", err);
      console.error("Stack trace:", err.stack);
        await interaction.editReply("Could not fetch latest Strava activity");
    }
	},
};