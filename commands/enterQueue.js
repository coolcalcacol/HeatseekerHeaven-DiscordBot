const { SlashCommandBuilder } = require('@discordjs/builders');
const cConsole = require('../utils/customConsoleLog');
const databaseUtilities = require('../utils/databaseUtilities');
const embedUtilities = require('../utils/embedUtilities');
const queueData = require('../data/queueData.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Adds your to the queue'),
    async execute(interaction, client) {
        const lobby = await databaseUtilities.get.getRankedLobbyById(interaction.channel);
        if (!lobby) {
            await interaction.reply({
                content: 'Something went wrong.... This is probably not the right channel for this command.', 
                ephemeral: true
            });
            return;
        }
        const response = await queueData.actions.addPlayerToQueue(interaction, lobby);
        console.log('response: ' + response)
        switch (response) {
            case 'enteredQueue': {
                await client.emit('queueEvent', interaction, 'add');
                await interaction.reply({
                    embeds: embedUtilities.presets.queueStatusEmbed(lobby, 'add', interaction)
                });
            } break;
            case 'alreadyInQueue': {
                await interaction.reply({
                    content: 'You are already in the queue', 
                    ephemeral: true
                });
            } break;
            case 'gameStarted': {
                await interaction.reply({
                    content: 'You started the queue', 
                    ephemeral: true
                });
            } break;
        
            default: {
                await interaction.reply({
                    content: 'Something went wrong.... I dont know what else to tell you here....', 
                    ephemeral: true
                });
            } break;
        }
    },
};