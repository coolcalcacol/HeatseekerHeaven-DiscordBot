const { SlashCommandBuilder } = require('@discordjs/builders');
const { cConsole, clientSendMessage, databaseUtilities, embedUtilities } = require('../utils/utilityManager.js');
const queueData = require('../data/queue.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Adds your to the queue'),
    async execute(interaction, client) {
        const lobby = await databaseUtilities.getRankedLobby(interaction.channel);
        if (!lobby) {
            await interaction.reply({
                content: 'Something went wrong.... This is probably not the right channel for this command.', 
                ephemeral: true
            });
            return;
        }
        const response = queueData.actions.addPlayerToQueue(interaction, lobby);
        
        if (response == 'enteredQueue') {
            await client.emit('queueEvent', interaction, 'add');
            await interaction.reply({
                embeds: embedUtilities.presets.queueStatusEmbed(lobby, 'User entered Queue')
            });
        }
        else if (response == 'alreadyInQueue') {
            await interaction.reply({
                content: 'You are already in the queue', 
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