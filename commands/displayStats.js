const { SlashCommandBuilder } = require('@discordjs/builders');
const EmbedUtilities = require('../utils/embedUtilities');
const PlayerData = require('../data/playerData');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Check your stats')
		.addStringOption(option => option
			.setName('type')
			.setDescription('The type of stats to display [Default = global]')
			.setRequired(false)
			.addChoice('1v1', 'ones')
			.addChoice('2v2', 'twos')
			.addChoice('3v3', 'threes')
			.addChoice('persistent', 'persistent'),
		)
		.addUserOption(option => option
			.setName('target-user')
			.setDescription('Which user to show the stats for')
			.setRequired(false),
		)
		.addBooleanOption(option => option
			.setName('visible')
			.setDescription('Display stats for everyone and not only for you?')
			.setRequired(false),
			// .addChoice('Public', 'true')
			// .addChoice('Private', 'false')
		),
	async execute(interaction) {
		const userId = interaction.options.get('target-user') ?
			interaction.options.get('target-user').user.id : interaction.user.id;
		const mode = interaction.options.getString('type') ?
			interaction.options.getString('type') : 'global';
		const data = await PlayerData.getPlayerDataById(userId);

		if (!data) {
			const message = interaction.options.getUser('target-user') ?
				`<@${interaction.options.getUser('target-user').id}> does not have any stats yet, they need to Queue first.` :
				'You do not have any stats yet. You need to Queue first.';
			await interaction.reply({
				ephemeral: true,
				content: message,
			});
			return;
		}
		await interaction.reply({
			ephemeral: !interaction.options.getBoolean('visible'),
			embeds: [EmbedUtilities.presets.playerStatsPreset(data, mode)],
		});
	},
};
