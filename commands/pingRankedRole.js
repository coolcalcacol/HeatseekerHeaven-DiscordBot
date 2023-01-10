const { SlashCommandBuilder } = require('@discordjs/builders');

const QueueConfig = require('../data/database/queueConfigStorage');

const queueSettings = require('../data/queueSettings');
const clientSendMessage = require('../utils/clientSendMessage');
const getQueueConfig = async function(guildId) {return await QueueConfig.findOne({ _id: guildId }).catch(console.error);};

const generalUtilities = require('../utils/generalUtilities');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ranked-ping')
		.setDescription('Ping the ranked role for a chance to get a queue together faster (only for impatient people)')
		.addStringOption(option => option
			.setName('message')
			.setDescription('Add a message to the ping so you can let everyone know why you are this impatient')
			.setRequired(false),
		),
	async execute(interaction) {
		const queueConfigData = await getQueueConfig(interaction.guild.id);
		const pingData = queueConfigData.rankedPing;
		if (!pingData.role) {
			await interaction.reply({
				ephemeral: true,
				content: 'This command has not been configured yet by the server admins, please ask them for help.',
			}).catch(console.error);
			return;
		}
		if ([null, 0].includes(pingData.currentCooldown) || pingData.currentCooldown <= new Date().getTime()) {
			// ping ranked role
			const time = new Date();
			const newCooldown = time.setHours(time.getHours() + pingData.cooldown);
			pingData.currentCooldown = newCooldown;
			await queueSettings.updateQueueDatabase(queueConfigData);
			const message = interaction.options.getString('message') ? `\n**${interaction.options.getString('message')}**` : '';
			await interaction.reply({
				ephemeral: false,
				content: `> Cooldown reset: <t:${generalUtilities.generate.getTimestamp(newCooldown)}:R>${message}`,
			}).catch(console.error);
			await clientSendMessage.sendMessageTo(
				interaction.channel.id,
				`<@&${queueConfigData.rankedPing.role}>`,
			);
		}
		else {
			await interaction.reply({
				ephemeral: true,
				content: 'Ranked Ping cooldown expires <t:' + generalUtilities.generate.getTimestamp(pingData.currentCooldown) + ':R>',
			}).catch(console.error);
		}
	},
};