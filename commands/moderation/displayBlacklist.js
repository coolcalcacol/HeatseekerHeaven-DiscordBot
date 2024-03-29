const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const QueueDatabase = require('../../data/database/queueDataStorage');

const generalUtilities = require('../../utils/generalUtilities');
const { getCommandPermissions } = require('../../utils/userPermissions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('display-blacklist')
		.setDescription('Displays the list of blacklisted users'),
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

		const getGuildQueueData = async function() {return await QueueDatabase.findOne({ _id: interaction.guild.id }).catch(console.error);};
		if (!await getGuildQueueData()) {
			await QueueDatabase.insertMany({ _id: interaction.guild.id });
			// guildQueueData = await QueueDatabase.findOne({_id: interaction.guild.id}).catch(console.error);
		}
		const guildQueueData = await getGuildQueueData();
		const guildBlacklist = guildQueueData.userBlacklist;

		const lineBreak = '───────────────';

		let nameFields = '';
		let durationFields = '';
		for (const user in guildBlacklist) {
			if (user === 'placeholder') continue;
			const target = guildBlacklist[user];
			nameFields += target.playerData.userData.mention + '\n' + lineBreak + '\n';
			durationFields += `<t:${generalUtilities.generate.getTimestamp(target.duration)}:R>\n${lineBreak}\n`;
		}
		if (nameFields === '') {
			nameFields = ' - ';
			durationFields = ' - ';
		}

		const embed = new MessageEmbed({
			title: 'User Blacklist',
			color: '#ff5354',
			fields: [
				{ name: 'User', value: nameFields, inline: true },
				{ name: 'Expiration', value: durationFields, inline: true },
			],
		});

		await interaction.reply({
			ephemeral: false,
			embeds: [embed],
		}).catch(console.error);
	},
};
