const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, MessageEmbed } = require('discord.js');
const generalData = require('../../data/generalData.js');
const generalUtilities = require('../../utils/generalUtilities');
const cConsole = require('../../utils/customConsoleLog');
const playerData = require('../../data/playerData');
const queueSettings = require('../../data/queueSettings');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.addUserOption(option => option
			.setName('target-user')
			.setDescription('Which user to get the data from to display')
			.setRequired(false),
		),
	async execute(interaction) {
		if (interaction.options.getUser('target-user')) {
			if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
				await interaction.reply({
					ephemeral: true,
					content: 'You do not have permission to use this option.\nTry using this command without any option',
				}).catch(console.error);
				cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use this command`);
				return;
			}
			console.log(interaction.user);
			const target = interaction.options.getUser('target-user');
			const queueSettingsData = await queueSettings.getQueueDatabaseById(interaction.guild.id).catch(console.error);
			const data = await playerData.getPlayerDataById(target.id, true, queueSettingsData).catch(console.error);
			await interaction.reply({
				ephemeral: true,
				content: '```js\n' + data + '```',
			}).catch(console.error);
		}
		else {
			const creatorData = await generalUtilities.info.getUserById('306395424690929674');
			const embed = new MessageEmbed({
				author: { name: creatorData.username, iconURL: creatorData.displayAvatarURL() },
				fields: [
					{
						name: 'Bot Start Time',
						value: `<t:${generalUtilities.generate.getTimestamp(generalData.botStats.upTime)}>`,
						inline: true,
					},
					{
						name: 'Bot Up Time',
						value: `<t:${generalUtilities.generate.getTimestamp(generalData.botStats.upTime)}:R>`,
						inline: true,
					},
				],
			});
			await interaction.reply({
				ephemeral: false,
				embeds: [embed],
			}).catch(console.error);
		}
	},
};
