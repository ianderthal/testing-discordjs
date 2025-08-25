const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  category: 'utility',
  cooldown: 5,
	data: new SlashCommandBuilder()
		.setName('sayno')
		.setDescription('gives you a creative way to say \'no\''),
	async execute(interaction) {
		try {
      await interaction.deferReply();

      const response = await fetch('https://naas.isalman.dev/no');
      if (!response.ok){
        throw new Error(`HTTP error! Status: ${Response.status}`);
      }

      const data = await response.json();

      await interaction.editReply(`\`${data.reason}\``);

    } catch (error) {
      console.log(error);
      await interaction.editReply('Failed to fetch from API');
    }
	},
};
