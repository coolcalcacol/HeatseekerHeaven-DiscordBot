const { SlashCommandBuilder } = require('@discordjs/builders');

const generalData = require('../../data/generalData');
const { getCommandPermissions } = require('../../utils/userPermissions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pause-queue')
		.setDescription('Prevent users from entering in queue')
		.addBooleanOption(option => option
			.setName('state')
			.setDescription('True: pause the queue | False: unpause the queue')
			.setRequired(true),
		),
	/**
     * @param interaction
    */
	async execute(interaction) {
		const permission = await getCommandPermissions(
			interaction,
			{
				creator: true,
				owner: true,
				admin: true,
				superAdmin: true,
				adminPermission: false,
			},
		);
		if (!permission) { return; }
		// const guildId = interaction.guild.id;

		const state = interaction.options.getBoolean('state');
		generalData.generalQueueSettings.pauseQueue = state;

		await interaction.reply({
			ephemeral: true,
			content: `You successfully ${state ? '' : 'un'}paused the queue`,
		}).catch(console.error);
	},
};
