const { SlashCommandBuilder } = require('@discordjs/builders');
const { ButtonInteraction } = require('discord.js');

const queueData = require('../../../data/queueData');

module.exports = {
    data: new SlashCommandBuilder().setName('team-selection_buttons'),

    /**
     * @param {ButtonInteraction} interaction
    */
    async execute(interaction) {
        const context = interaction.customId.split('_');
        const selectionMethod = context[1];
        const gameId = context[2];
        const gameData = queueData.info.getGameDataById(gameId);

        if (!gameData) {
            console.log('Game not found');
            return;
        }
        if (gameData.teamSelectionVotes.balanced.users.includes(interaction.user.id) || gameData.teamSelectionVotes.random.users.includes(interaction.user.id)) {
            console.log('User has already voted');
            await interaction.deferUpdate();
            return;
        }

        switch(selectionMethod) {
            case 'balanced': { 
                gameData.teamSelectionVotes.balanced.count++;
                gameData.teamSelectionVotes.balanced.users.push(interaction.user.id);
            } break;
            case 'random': { 
                gameData.teamSelectionVotes.random.count++;
                gameData.teamSelectionVotes.random.users.push(interaction.user.id);
            } break;
            default: break;
        }

        if (gameData.teamSelectionVotes.balanced.count > gameData.teamSelectionVotes.random.count) {
            gameData.teamSelection = 'balanced';
        }
        else if (gameData.teamSelectionVotes.random.count > gameData.teamSelectionVotes.balanced.count) {
            gameData.teamSelection = 'random';
        }

        if (
            gameData.teamSelectionVotes.balanced.count + gameData.teamSelectionVotes.random.count >= Object.keys(gameData.players).length ||
            gameData.teamSelectionVotes.balanced.count >= (Object.keys(gameData.players).length / 2) ||
            gameData.teamSelectionVotes.random.count >= (Object.keys(gameData.players).length / 2)
        ) {
            // finish the vote
            gameData.startGame();
        }

        gameData.getTeamSelectionMessageContent(true);
        await interaction.deferUpdate();
    }
};