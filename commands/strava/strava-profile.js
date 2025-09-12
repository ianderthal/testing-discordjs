const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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

      const exampleEmbed = new EmbedBuilder()
        .setColor('FC4C02')
        .setTitle(`Strava Profile - ${profile.firstname} ${profile.lastname}`)
        .setURL('https://discord.js.org/')
        .setAuthor({ name: 'Strava API', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://discord.js.org' })
        .setDescription('Check out this sweet-ass embed from Strava with your profile information')
        .addFields(
          { name: 'Profile Information', value: jsonOutput }
        )
        .setTimestamp()
        .setFooter({ text: 'Powered by Strava', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

      //channel.send({ embeds: [exampleEmbed] });
      await interaction.editReply({ embeds: [exampleEmbed] });
    } catch(err) {
      console.error("Error fetching Strava profile:", err.message);
      await interaction.editReply("Could not fetch Strava profile.");
    }
	},
};
