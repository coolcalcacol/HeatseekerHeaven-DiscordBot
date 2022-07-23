const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const sleep = require('node:timers/promises').setTimeout;
const queueData = require('../data/queueData');
const QueueDatabase = require('../data/database/queueDataStorage')
const generalData = require('../data/generalData');
const generalUtilities = require('../utils/generalUtilities');
const embedUtilities = require('../utils/embedUtilities');
const mmrCalculator = require('../data/mmrCalculator');

const { SlashCommandBuilder } = require('@discordjs/builders');
const clientSendMessage = require('../utils/clientSendMessage');

var interactorList = {};
// var currentReply;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report the outcome of the game you participated in'),
    async execute(initialInteraction) {
        // interactorList[interaction.user.id] = {replyMessage: ''};
        const originalInteractorId = initialInteraction.user.id;
        const gameOutcomeSelector = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('game_outcome_selector')
                    .setPlaceholder('Won? / Lost?')
                    .addOptions([
                        {
                            label: 'Won',
                            description: 'You (and your team) Won the game',
                            value: 'game_won',
                        },
                        {
                            label: 'Lost',
                            description: 'You (and your team) Lost the game',
                            value: 'game_lost',
                        },
                    ]),
            );
        var gameData;
        var targetTeam; // The team that the reporter is a part of
        var oponentTeam; // The oposite team;
        var targetTeamName; 
        var oponentTeamName; 
        console.log('Searchig GameData containing reporter')
        for (let i = 0; i < queueData.info.globalQueueData.gamesInProgress.length; i++) {
            const game = queueData.info.globalQueueData.gamesInProgress[i];
            for (const team in game.teams) {
                for (const playerData in game.teams[team].members) {
                    const player = game.teams[team].members[playerData];
                    if (player['_id'] == initialInteraction.user.id) {
                        gameData = game;
                        targetTeam = game.teams[team];
                        targetTeamName = team;
                        oponentTeam = team == 'blue' ? game.teams['orange'] : game.teams['blue'];
                        oponentTeamName = team == 'blue' ? 'orange' : 'blue'
                        break;
                    }
                }
                if (gameData != null) break;
            }
            if (gameData != null) break;
        }
        if (!gameData) {
            await initialInteraction.reply({
                ephemeral: true,
                content: 'You are not part of an ongoing game'
            }).catch(console.error);
            // currentReply = await interaction.fetchReply();
            return;
        }
        if (gameData.reportStatus == true) {
            await initialInteraction.reply({
                ephemeral: true,
                content: 'This game is already reported'
            }).catch(console.error);
            // currentReply = await interaction.fetchReply();
            return;
        }
        else if (gameData.reportStatus == 'inProgress') {
            await initialInteraction.reply({
                ephemeral: true,
                content: 'This game is already being reported by someone else'
            }).catch(console.error);
            // currentReply = await interaction.fetchReply();
            return;
        }
        gameData.reportStatus = 'inProgress';

        await initialInteraction.reply({
            ephemeral: false,
            embeds: [embedUtilities.presets.reportGamePreset(gameData)],
            components: [gameOutcomeSelector]
        }).catch(console.error);
        // // currentReply = await interaction.fetchReply();
        // interactorList[interaction.user.id].replyMessage = await interaction.fetchReply();
        // console.log(interactorList);
        generalData.client.on('interactionCreate', async interaction => {
            if (!interaction.isSelectMenu() || !gameData) return;
            
            if (interaction.customId === 'game_outcome_selector') {
                try {
                    if (interaction.user.id != originalInteractorId) { // did the original trigger use this interaction?
                        console.log(`${interaction.user.username} tried to select ${interaction.customId} .for someone else`);
                        await interaction.reply({
                            ephemeral: true,
                            content: `You cant use someone elses command`
                        }).catch(console.error);
                        return;
                    }
                    // await interaction.deferReply().catch(console.error);
                    const gameResults = interaction.values[0] == 'game_won' ? 
                        mmrCalculator.getGameResults(targetTeam, oponentTeam) : 
                        mmrCalculator.getGameResults(oponentTeam, targetTeam) ;
                    const winningTeamName = interaction.values[0] == 'game_won' ? targetTeamName : oponentTeamName;
                    

                    const storedQueueData = await QueueDatabase.findOne({});
                    await clientSendMessage.sendMessageTo(storedQueueData.channelSettings.matchReportChannel, {
                        embeds: [embedUtilities.presets.gameResultPreset(gameData, gameResults, interaction.user.username, winningTeamName)],
                        components: []
                    }).catch(console.error);

                    await interaction.update({
                        embeds: [embedUtilities.presets.gameResultPreset(gameData, gameResults, interaction.user.username, winningTeamName)],
                        components: []
                    }).catch(console.error);
                    gameData.reportStatus = true;
                    queueData.info.globalQueueData.gameHistory.push(gameData);
                    const inProgressList = queueData.info.globalQueueData.gamesInProgress;
                    queueData.info.globalQueueData.gamesInProgress.splice(inProgressList.indexOf(item => item.gameId === gameData.gameId), 1);
                    gameData = null;
                    interaction = null;
                } catch(err) {
                    console.error(err);
                }
                
            }
        });
    },
};