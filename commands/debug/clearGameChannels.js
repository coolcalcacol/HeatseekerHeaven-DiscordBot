const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, Client } = require('discord.js');

const generalData = require('../../data/generalData');
const queueSettings = require('../../data/queueSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear-game-channels')
        .setDescription('Clears all the channels out of the game channels category'),

    /** 
     * @param {Client} client
    */
    async execute(interaction) {
        if (interaction != null && interaction.user.id != '306395424690929674') {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to use this command.',
            }).catch(console.error);
            cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use this command`);
            return;
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