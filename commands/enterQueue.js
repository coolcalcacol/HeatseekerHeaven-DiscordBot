const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

const cConsole = require('../utils/customConsoleLog');
const databaseUtilities = require('../utils/databaseUtilities');
const embedUtilities = require('../utils/embedUtilities');
const queueData = require('../data/queueData.js');
const queueSettings = require('../data/queueSettings');
const generalData = require('../data/generalData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Adds you to the queue'),
    currentQueueMessage: {
        ones: null,
        twos: null,
        threes: null,
    },
    queueState: {
        locked: false,
        lockReason: 'No reason was found',
    },
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
        var response = (generalData.generalQueueSettings.pauseQueue) ? 'queuePaused' : await queueData.actions.addPlayerToQueue(interaction, lobby, null, queueSettingsData);
        var responseArgs = '';
        if (response.includes(':')) {
            const split = response.split(':');
            response = split[0]
            responseArgs = split[1];
        }
        console.log('response: ' + response)
        switch (response) {
            case 'queuePaused': {
                await interaction.reply({
                    content: 'The queue is paused at the moment. This usually means that the bot is being maintained.', 
                    ephemeral: true
                });
            } break;
            case 'enteredQueue': {
                await interaction.reply({
                    embeds: [embedUtilities.presets.queueStatusEmbed(lobby, 'add', interaction)]
                });
                
                if (this.currentQueueMessage[lobby]) { this.currentQueueMessage[lobby].delete(); }
                this.currentQueueMessage[lobby] = await interaction.fetchReply();

                interaction.client.emit('queueEvent', interaction, 'add', queueData.info.getLobbyString(lobby));
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
                const game = queueData.info.globalQueueData.getActiveGame(responseArgs);
                
                const embed = new MessageEmbed({
                    title: 'Game has started!',
                    description: game.getPlayersString(true),
                    color: '#00ff00',
                    timestamp: new Date().getTime(),
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: false
                    // embeds: embedUtilities.presets.queueGameStartLobbyPreset(game), // teams are not selected yet
                });
                if (this.currentQueueMessage[lobby]) { this.currentQueueMessage[lobby].delete(); }
                this.currentQueueMessage[lobby] = null;
                // await interaction.reply({
                //     embeds: [embedUtilities.presets.queueStatusEmbed(lobby, 'add', interaction)]
                // });
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