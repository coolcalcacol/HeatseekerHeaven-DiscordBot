const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const sleep = require('node:timers/promises').setTimeout;
const queueData = require('../data/queueData');
const QueueDatabase = require('../data/database/queueConfigStorage')
const queueSettings = require('../data/queueSettings');
const playerData = require('../data/playerData');
const generalData = require('../data/generalData');
const mmrCalculator = require('../data/mmrCalculator');

const generalUtilities = require('../utils/generalUtilities');
const cConsole = require('../utils/customConsoleLog');
const embedUtilities = require('../utils/embedUtilities');
const clientSendMessage = require('../utils/clientSendMessage');

function getRandomNumberCustomId() {
    return
}
module.exports = {
    data: new SlashCommandBuilder().setName('report').setDescription('Report the outcome of the game you participated in'),
    reportData: {},
    async execute(interaction) {
        thisLog('Searchig GameData containing reporter');
        thisLog(queueData.info.globalQueueData);
        var targetGameData = null;
        for (let i = 0; i < queueData.info.globalQueueData.gamesInProgress.length; i++) {
            const game = queueData.info.globalQueueData.gamesInProgress[i];
            for (const team in game.teams) {
                for (const playerData in game.teams[team].members) {
                    const player = game.teams[team].members[playerData];
                    if (player['_id'] == interaction.user.id) {
                        targetGameData = game;
                        break;
                    }
                }
                if (targetGameData != null) break;
            }
            if (targetGameData != null) break;
        }
        if (!targetGameData) {
            await interaction.reply({
                ephemeral: true,
                content: 'You are not part of an ongoing game'
            }).catch(console.error);
            // currentReply = await interaction.fetchReply();
            return;
        }
        this.validateGameData(interaction, targetGameData);

        // if (this.gameData.reportStatus == 'inProgress') {
        //     await interaction.reply({
        //         ephemeral: true,
        //         content: 'This game is in the progress of being reported by someone else'
        //     }).catch(console.error);
        //     return;
        // }
        // if (this.gameData.reportStatus == true) {
        //     await interaction.reply({
        //         ephemeral: true,
        //         content: 'This game is already reported'
        //     }).catch(console.error);
        //     return;
        // }
        // this.gameData.reportStatus = 'inProgress';
    },
    async validateGameData(interaction, targetGameData) {
        for (const gameId in this.reportData) {
            const game = this.reportData[gameId]
            if (gameId == targetGameData.gameId) {
                await interaction.reply({
                    ephemeral: true,
                    content: 
                        'This game is already being reported by someone else.\n' + 
                        'Here is the report message link: ' + game.reportMessage.url,
                }).catch(console.error);
                return;
            }
        }
        
        const startTime = new Date(targetGameData.startTime).getTime();
        const endTime = new Date().getTime();
        const gameDuration = (endTime - startTime) - ((endTime - startTime) * 0.1);
        console.log(`Raw Seconds: ${(endTime - startTime) / 1000} = Game Duration: ${gameDuration / 1000}`);
        targetGameData.gameDuration = gameDuration;

        if (!generalData.debugMode) {
            if ((gameDuration / 1000 / 60) < 1) { // duration is less than 1 minute
                await interaction.reply({
                    ephemeral: true,
                    content: 'You can only report a game after 1 minutes of playing'
                }).catch(console.error);
                return;
            }
        }
        

        this.reportData[targetGameData.gameId] = {
            gameData: targetGameData,
            initialReporter: interaction.user,
            reportMessage: {},
        }
        const component = this.constructMessageComponent(targetGameData.gameId);
        await interaction.reply({
            ephemeral: false,
            embeds: [embedUtilities.presets.reportGamePreset(targetGameData)],
            components: [component]
        }).catch(console.error);
        this.reportData[targetGameData.gameId].reportMessage = await interaction.fetchReply();

        // console.log(this.reportData[targetGameData.gameId]);
        thisLog('Game data validated');
        thisLog(this.reportData);
    },
    constructMessageComponent(gameId) {
        const gameOutcomeSelector = new MessageSelectMenu({
            custom_id: 'report_select-game-outcome_' + gameId,
            placeholder: 'Won? / Lost?',
            options: [
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
            ]
        });
        const reportActionRow = new MessageActionRow();
        reportActionRow.components = [gameOutcomeSelector];
        return reportActionRow;
    }
};

function thisLog(message) {
    if (!generalData.logOptions.gameReport) return;
    if (typeof message == 'object') {
        cConsole.log('--------[fg=green]Game Report[/>]--------');
        console.log(message);
    } else {
        cConsole.log('[fg=green]Game Report[/>]: ' + message);
    }
}