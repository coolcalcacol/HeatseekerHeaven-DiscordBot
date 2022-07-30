const { SlashCommandBuilder } = require('@discordjs/builders');

const reportCommand = require('../../reportGame');
const mmrCalculator = require('../../../data/mmrCalculator');
const playerData = require('../../../data/playerData');
const QueueDatabase = require('../../../data/database/queueDataStorage');
const queueSettings = require('../../../data/queueSettings');
const queueData = require('../../../data/queueData');
const embedUtilities = require('../../../utils/embedUtilities');
const clientSendMessage = require('../../../utils/clientSendMessage');
const generalData = require('../../../data/generalData');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('report_select'),
    async execute(interaction) {
        console.log(interaction);
        const report = reportCommand.reportData[interaction.customId.split('_')[2]];
        const gameData = report.gameData;
        const queueSettingsData = await queueSettings.getQueueDatabaseById(interaction.guild.id, true);

        var targetTeam; // The team that the reporter is a part of
        var oponentTeam; // The oposite team;
        var targetTeamName;
        var oponentTeamName; 
        console.log('Searchig Target Team containing reporter')
        for (const team in gameData.teams) {
            for (const playerData in gameData.teams[team].members) {
                const player = gameData.teams[team].members[playerData];
                if (player['_id'] == interaction.user.id) {
                    // this.gameData = gameData;
                    targetTeam = gameData.teams[team];
                    targetTeamName = team;
                    oponentTeam = team == 'blue' ? gameData.teams['orange'] : gameData.teams['blue'];
                    oponentTeamName = team == 'blue' ? 'orange' : 'blue'
                    break;
                }
            }
            if (targetTeam != null) break;
        }
        if (!targetTeam) {
            await interaction.reply({
                ephemeral: true,
                content: 'This game report is not meant for you...'
            }).catch(console.error);
            // currentReply = await interaction.fetchReply();
            return;
        }
        
        if (gameData.reportStatus == true) {
            await interaction.reply({
                ephemeral: true,
                content: 'This game is already reported'
            }).catch(console.error);
            // currentReply = await interaction.fetchReply();
            return;
        }
        try {
            const gameResults = await interaction.values[0] == 'game_won' ? 
                mmrCalculator.getGameResults(targetTeam, oponentTeam, queueSettingsData.mmrSettings) : 
                mmrCalculator.getGameResults(oponentTeam, targetTeam, queueSettingsData.mmrSettings) ;
            const winningTeamName = interaction.values[0] == 'game_won' ? targetTeamName : oponentTeamName;
            

            const storedQueueData = await QueueDatabase.findOne({});
            await clientSendMessage.sendMessageTo(storedQueueData.channelSettings.matchReportChannel, {
                embeds: [embedUtilities.presets.gameResultPreset(gameData, gameResults, interaction.user, winningTeamName)],
                components: []
            }).catch(console.error);

            await interaction.update({
                embeds: [embedUtilities.presets.gameResultPreset(gameData, gameResults, interaction.user, winningTeamName)],
                components: []
            }).catch(console.error);

            gameData.reportStatus = true;
            gameData.gameResults = gameResults;
            queueData.info.globalQueueData.gameHistory.push(gameData);

            const inProgressList = queueData.info.globalQueueData.gamesInProgress;
            queueData.info.globalQueueData.gamesInProgress.splice(inProgressList.indexOf(item => item.gameId === gameData.gameId), 1);
            
            delete reportCommand.reportData[gameData.gameId];

            if (!generalData.debugMode) {
                playerData.updatePlayerRanks(interaction.guild.id);
            }


        } catch(err) {
            console.error(err);
        }

        // await interaction.update({
        //     ephemeral: true,
        //     embeds: embed,
        //     components: []
        // }).catch(console.error);
        // return;
    },
};