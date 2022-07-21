const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const sleep = require('node:timers/promises').setTimeout;
const QueueData = require('../data/queueData');
const GeneralData = require('../data/generalData');
const GeneralUtilities = require('../utils/generalUtilities');
const EmbedUtilities = require('../utils/embedUtilities');
const MmrCalculator = require('../data/mmrCalculator');

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('Report the outcome of the game you participated in'),
    async execute(interaction) {
        const originalInteractorId = interaction.user.id;
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
        for (let i = 0; i < QueueData.info.globalQueueData.gamesInProgress.length; i++) {
            const game = QueueData.info.globalQueueData.gamesInProgress[i];
            for (const team in game.teams) {
                for (const playerData in game.teams[team].members) {
                    const player = game.teams[team].members[playerData];
                    if (player['_id'] == interaction.user.id) {
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
            await interaction.reply({
                ephemeral: true,
                content: 'You are not part of an ongoing game'
            });
            return;
        }
        
        await interaction.reply({
            ephemeral: false,
            embeds: [EmbedUtilities.presets.reportGamePreset(gameData)],
            components: [gameOutcomeSelector]
        });

        GeneralData.client.on('interactionCreate', async interaction => {
            if (!interaction.isSelectMenu()) return;
            if (interaction.user.id != originalInteractorId) { // did the original trigger use this interaction?
                console.log(`${interaction.user.username} tried to select ${interaction.customId} .for someone else`);
                if (interaction.customId === 'game_outcome_selector') {
                    await interaction.reply({
                        ephemeral: true,
                        content: `<@${interaction.user.id}> You cant use someone elses command`
                    })
                }
                return;
            }
        
            if (interaction.customId === 'game_outcome_selector') {
                // await interaction.deferUpdate();
                const gameResults = interaction.values[0] == 'game_won' ? 
                    MmrCalculator.getGameResults(targetTeam, oponentTeam) : 
                    MmrCalculator.getGameResults(oponentTeam, targetTeam) ;
                const winningTeamName = interaction.values[0] == 'game_won' ? targetTeamName : oponentTeamName;

                // console.log(interaction.member);
                // console.log(interaction.member.displayHexColor);
                // await sleep(4000);
                await interaction.update({
                    embeds: [EmbedUtilities.presets.gameResultPreset(gameData, gameResults, interaction.user.username, winningTeamName)],
                    components: []
                });
            }
        });
    },
};