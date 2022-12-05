const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, Client } = require('discord.js');

const generalData = require('../../data/generalData');
const queueSettings = require('../../data/queueSettings');
const { getCommandPermissions } = require('../../utils/userPermissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-game-channels')
        .setDescription('Clears all the channels out of the game channels category'),

    /** 
     * @param {Client} client
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
                    adminPermission: false
                }
            );
            if (!permission) { return; }
        }

        const guild = (interaction) ? interaction.guild : await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
        const queueConfig = await queueSettings.getQueueDatabaseById(guild.id);
        const channels = await guild.channels.cache;
        var deletedChannels = [];
        var deletionCount = 0;
        channels.forEach(async (c) => {
            if (c.parent) {
                if (c.parent.id == queueConfig.channelSettings.teamChannelCategory) {
                    deletionCount++;
                    deletedChannels.push(c.name)
                    await c.delete();
                }
            }
        });

        if (interaction) {
            await interaction.reply({
                ephemeral: true,
                content: `**Deletion count**: ${deletionCount}\n**Deleted channels**:\n\`\`\`\n${deletedChannels.join('\n')}\n\`\`\``
            }).catch(console.error);
            // console.log(await guild.channels.cache.filter((c) => {c.parent.id == queueConfig.channelSettings.teamChannelCategory}));
        }
    },
};