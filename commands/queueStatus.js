const { SlashCommandBuilder } = require('@discordjs/builders');
const { cConsole, databaseUtilities, embedUtilities } = require('../utils/utilityManager.js');
const queueData = require('../data/queue.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Replies with the current queue status'),
    async execute(interaction) {
        const lobby = await databaseUtilities.getRankedLobby(interaction.channel);
        if (!lobby) {
            await interaction.reply({
                content: 'Something went wrong.... This is probably not the right channel for this command.', 
                ephemeral: true
            });
            return;
        }
        await interaction.reply({
            embeds: embedUtilities.presets.queueStatusEmbed(lobby, '', '#34eb98')
        });
    },
};