const { SlashCommandBuilder } = require('@discordjs/builders');
const embedUtilities = require('../utils/embedUtilities');
const queueData = require('../data/queueData.js');
const queueSettings = require('../data/queueSettings');
const generalData = require('../data/generalData');
const { getCommandPermissions } = require('../utils/userPermissions');

const userWhitelist = generalData.userWhitelist;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fillqueue')
		.setDescription('Fills the queue with random people to test the queue system')
		.addNumberOption(option => option
			.setName('size')
			.setDescription('Enter the numbers of players added to the queue')
			.setRequired(false),
		),
	async execute(interaction) {
		const permission = await getCommandPermissions(
			interaction,
			{
				creator: true,
				owner: false,
				admin: false,
				superAdmin: true,
				adminPermission: false,
			},
		);
		if (!permission) { return; }

		const lobby = await queueSettings.getRankedLobbyById(interaction.channel, interaction.guild.id);
		if (!['ones', 'twos', 'threes'].includes(lobby)) {
			await interaction.reply({
				content: 'Something went wrong.... This is probably not the right channel for this command.',
				ephemeral: true,
			});
			return;
		}
		let size = interaction.options.getNumber('size');
		if (size === 0 || size == null) { size = 6; }

		const queueSettingsData = await queueSettings.getQueueDatabaseById(interaction.guild.id).catch(console.error);
		await queueData.actions.fillQueueWithPlayers(userWhitelist, lobby, size, queueSettingsData);

		interaction.client.emit('queueEvent', interaction, 'add');
		await interaction.reply({
			embeds: [embedUtilities.presets.queueStatusEmbed(lobby, 'add', interaction)],
		});
	},
};
