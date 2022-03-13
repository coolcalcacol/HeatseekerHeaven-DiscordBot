const { SlashCommandBuilder } = require('@discordjs/builders');
const { cConsole, clientSendMessage } = require('../utilities/utilityManager.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.addStringOption(option => option.setName('name').setDescription('some description')),
	async execute(interaction, optionsx) {
		const options = interaction.options;
		if (options._hoistedOptions.length > 0) {
			await interaction.reply('Pong! ```json\n' + JSON.stringify(options, '', 4) + '```');
			//cConsole.log(options);
		}
		else {
			await interaction.reply('Pong!');
		}
	},
};