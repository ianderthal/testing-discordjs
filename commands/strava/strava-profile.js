const { SlashCommandBuilder } = require('discord.js');
const { stravaFetch } = require("../../services/strava");

module.exports = {
  category: 'strava',
  cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('strava-profile')
		.setDescription('get strava profile'),
	async execute(interaction) {
    await interaction.deferReply();

    try {
      const profile = await stravaFetch("athlete");

      const jsonOutput = "```json\n" + JSON.stringify(profile, null, 2).slice(0, 1900) + "\n```";

      await interaction.editReply(jsonOutput);
    } catch(err) {
      console.error("Error fetching Strava profile:", err.message);
      await interaction.editReply("Could not fetch Strava profile.");
    }
	},
};
