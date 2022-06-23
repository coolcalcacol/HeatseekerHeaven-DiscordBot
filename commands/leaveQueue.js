const { SlashCommandBuilder } = require('@discordjs/builders');
const { cConsole, clientSendMessage, databaseUtilities, embedUtilities } = require('../utils/utilityManager.js');
const queueData = require('../data/queue.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Removes your from the queue'),
    async execute(interaction, client) {
        const lobby = await databaseUtilities.getRankedLobby(interaction.channel);
        if (!lobby) {
            await interaction.reply({
                content: 'Something went wrong.... This is probably not the right channel for this command.', 
                ephemeral: true
            });
            return;
        }
        const response = queueData.actions.removePlayerFromQueue(interaction, lobby);
        
        if (response == 'removedFromQueue') {
            await client.emit('queueEvent', interaction, 'removed');
            await interaction.reply({
                embeds: embedUtilities.presets.queueStatusEmbed(lobby, 'User left Queue', 'eb6e34')
            });
        }
        else if (response == 'wasNotInQueue') {
            await interaction.reply({
                content: 'You are not in the queue.', 
                ephemeral: true
            });
        }
        else {
            await interaction.reply({
                content: 'Something went wrong.... I dont know what else to tell you here....', 
                ephemeral: true
            });
        }
    },
};