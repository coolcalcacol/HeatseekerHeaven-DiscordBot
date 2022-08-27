const { SlashCommandBuilder } = require('@discordjs/builders');
const cConsole = require('../utils/customConsoleLog');
const databaseUtilities = require('../utils/databaseUtilities');
const embedUtilities = require('../utils/embedUtilities');
const queueData = require('../data/queueData.js');
const queueSettings = require('../data/queueSettings');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Adds your to the queue'),
    async execute(interaction) {
        const lobby = await queueSettings.getRankedLobbyById(interaction.channel, interaction.guild.id);
        if (!['ones', 'twos', 'threes'].includes(lobby)) {
            await interaction.reply({
                content: 'Something went wrong.... This is probably not the right channel for this command.', 
                ephemeral: true
            });
            return;
        }
        const queueSettingsData = await queueSettings.getQueueDatabaseById(interaction.guild.id).catch(console.error);
        const response = await queueData.actions.addPlayerToQueue(interaction, lobby, null, queueSettingsData);
        console.log('response: ' + response)
        switch (response) {
            case 'enteredQueue': {
                await interaction.client.emit('queueEvent', interaction, 'add', queueData.info.getLobbyString(lobby));
                await interaction.reply({
                    embeds: [embedUtilities.presets.queueStatusEmbed(lobby, 'add', interaction)]
                });
            } break;
            case 'userIsBlacklisted': {
                await interaction.reply({
                    content: 'You do not have permission to queue at this time sinse you have been blacklisted.', 
                    ephemeral: true
                });
            } break;
            case 'inQueue': {
                await interaction.reply({
                    content: 'You are already in the queue', 
                    ephemeral: true
                });
            } break;
            case 'inOngoingGame': {
                await interaction.reply({
                    content: 'You are in an un-reported game', 
                    ephemeral: true
                });
            } break;
            case 'gameStarted': {
                // await interaction.reply({
                //     content: 'You started the queue', 
                //     ephemeral: true
                // });
                await interaction.reply({
                    embeds: [embedUtilities.presets.queueStatusEmbed(lobby, 'add', interaction)]
                });
            } break;
        
            default: {
                await interaction.reply({
                    content: 'Something went wrong.... I dont know what else to tell you here....\nReturn status: `' + response + '`', 
                    ephemeral: true
                });
            } break;
        }
    },
};