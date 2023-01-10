const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('quick-chat')
		.setDescription('Sends a quick chat')
		.addStringOption(option => option
			.setName('message')
			.setDescription('The quick chat message to send')
			.setRequired(true)
		// .setAutocomplete(true)
			.setChoices([
				['Nice Cock!', 'Nice Cock!'],
			]),
		),
	async execute(interaction) {
		await interaction.reply({
			ephemeral: true,
			content: 'This command is not configured yet...',
		});
	},
};