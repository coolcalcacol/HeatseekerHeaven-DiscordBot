const { SlashCommandBuilder } = require('@discordjs/builders');

const generalData = require('../../data/generalData');
const queueSettings = require('../../data/queueSettings');
const { getCommandPermissions } = require('../../utils/userPermissions');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear-game-channels')
		.setDescription('Clears all the channels out of the game channels category'),

	/**
	 * @param interaction
	 */
	async execute(interaction) {
		if (interaction != null) {
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
		}

		const guild = (interaction) ? interaction.guild : await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
		const queueConfig = await queueSettings.getQueueDatabaseById(guild.id);
		if (!queueConfig.channelSettings.teamChannelCategory) { return; }
		const channels = await guild.channels.cache;

		const deletedChannels = [];
		let deletionCount = 0;
		for (const channel of channels) {
			if (channel.parent) {
				if (channel.parent.id === queueConfig.channelSettings.teamChannelCategory) {
					deletionCount++;
					deletedChannels.push(channel.name);
					await channel.delete();
				}
			}
		}
		// console.log(inActiveGameRole);
		// console.log(inActiveGameRole);
		// guild.members.fetch();
		// const targetRole = await guild.roles.cache.get(inActiveGameRole.id)
		// targetRole.members.map(async m => {await m.roles.remove(inActiveGameRole.id); console.log(`removed role from: ${m.user.username}`)});

		// const findMembers = await guild.members.fetch().find((m) => {console.log(m); return m._roles.includes(inActiveGameRole.id)}) // .roles.remove(inActiveGameRole.id);
		// console.log(findMembers);

		// const roleMembers = async (role) => {return role.members};

		// console.log(fetchMembers);
		// console.log(guildRole);
		// console.log(await roleMembers(guildRole));
		// console.log(await guildRole.members.map());
		// for (const member of membersWithInGameRole) {
		//     await member.roles.remove(inActiveGameRole.id);
		// }

		if (interaction) {
			await interaction.reply({
				ephemeral: true,
				content: `**Deletion count**: ${deletionCount}\n**Deleted channels**:\n\`\`\`\n${deletedChannels.join('\n')}\n\`\`\``,
			}).catch(console.error);
			// console.log(await guild.channels.cache.filter((c) => {c.parent.id == queueConfig.channelSettings.teamChannelCategory}));
		}
	},
};
