const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { stravaFetch } = require("../../services/strava");
const dayjs = require('dayjs');

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

      const formattedCreatedAtDate = dayjs(`${ profile.created_at }`).format("MM-DD-YYYY");

      const profileEmbed = new EmbedBuilder()
        .setColor('#FC5200')
        .setTitle(`Strava Athlete Profile - ${ profile.firstname } ${ profile.lastname }`)
        .setURL(`https://strava.com/athletes/${ profile.id }`)
        .setAuthor({ name: 'Strava API', iconURL: 'https://cdn.brandfetch.io/idTLzKLmej/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668515681500', url: 'https://strava.com' })
        .addFields(
		      { name: 'Location', value: `${ profile.city }, ${ profile.state } - ${ profile.country }`, inline: true },
		      { name: 'Member Since', value: formattedCreatedAtDate, inline: true },
        )
        .setImage('https://dgalywyr863hv.cloudfront.net/pictures/athletes/17866718/5098592/3/medium.jpg')
        .setTimestamp()
        .setAuthor({ name: 'Strava API', iconURL: 'https://cdn.brandfetch.io/idTLzKLmej/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1668515681500', url: 'https://strava.com' })
        .setFooter({ text: 'Powered by Strava' });

      await interaction.editReply({ embeds: [profileEmbed] });
    } catch(err) {
      console.error("Error fetching Strava profile:", err.message);
      console.error("Error fetching Strava profile:", err);
      console.error("Stack trace:", err.stack);
      await interaction.editReply("Could not fetch Strava profile.");
    }
	},
};
