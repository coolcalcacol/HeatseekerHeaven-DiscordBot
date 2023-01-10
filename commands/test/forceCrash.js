const { SlashCommandBuilder } = require('@discordjs/builders');
const generalData = require('../../data/generalData');
const cConsole = require('../../utils/customConsoleLog');
const { getCommandPermissions } = require('../../utils/userPermissions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('force-crash')
		.setDescription('Crashes the bot for test purposes'),
	async execute(interaction) {
		const permission = await getCommandPermissions(
			interaction,
			{
				creator: true,
				owner: false,
				admin: false,
				superAdmin: false,
				adminPermission: false,
			},
		);
		if (!permission) { return; }
		cConsole.log('[bg=red][fg=white]Crashing bot...[/>]');
		await interaction.reply({
			ephemeral: true,
			content: 'I dont feel so good...',
		}).catch(console.error);
		const paradox = generalData.client.guilds.thisSentenceIsFalse(false);
		console.log(paradox);
	},
};
