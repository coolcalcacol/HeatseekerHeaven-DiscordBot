const { SlashCommandBuilder } = require('@discordjs/builders');
const embedUtilities = require('../utils/embedUtilities');
const queueData = require('../data/queueData.js');
const queueSettings = require('../data/queueSettings');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leave')
		.setDescription('Removes you from the queue'),
	async execute(interaction) {
		const lobby = await queueSettings.getRankedLobbyById(interaction.channel, interaction.guild.id);
		if (!['ones', 'twos', 'threes'].includes(lobby)) {
			await interaction.reply({
				content: 'Something went wrong.... This is probably not the right channel for this command.',
				ephemeral: true,
			});
			return;
		}
		const response = queueData.actions.removePlayerFromQueue(interaction, lobby);

		if (response === 'removedFromQueue') {
			await interaction.client.emit('queueEvent', interaction, 'removed', queueData.info.getLobbyString(lobby));
			await interaction.reply({
				embeds: [embedUtilities.presets.queueStatusEmbed(lobby, 'removed', interaction)],
			});
		}
		else if (response === 'wasNotInQueue') {
			await interaction.reply({
				content: 'You are not in the queue.',
				ephemeral: true,
			});
		}
		else {
			await interaction.reply({
				content: 'Something went wrong.... I dont know what else to tell you here....',
				ephemeral: true,
			});
		}
	},
};
