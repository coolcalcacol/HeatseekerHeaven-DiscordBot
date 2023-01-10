const { SlashCommandBuilder } = require('@discordjs/builders');
const generalData = require('../../../data/generalData');

const queueData = require('../../../data/queueData');

module.exports = {
	data: new SlashCommandBuilder().setName('team-selection_buttons'),

	/**
     * @param interaction
    */
	async execute(interaction) {
		const context = interaction.customId.split('_');
		const selectionMethod = context[1];
		const gameId = context[2];
		const gameData = queueData.info.getGameDataById(gameId);

		if (!gameData) {
			console.error('Game not found');
			return;
		}
		if (
			!generalData.debugMode &&
            (gameData.teamSelectionVotes.balanced.users.includes(interaction.user.id) || gameData.teamSelectionVotes.random.users.includes(interaction.user.id))
		) {
			console.log(interaction.user.username + ' has already voted');
			await interaction.deferUpdate();
			return;
		}

		switch (selectionMethod) {
		case 'balanced': {
			gameData.teamSelectionVotes.balanced.count++;
			gameData.teamSelectionVotes.balanced.users.push(interaction.user.id);
		} break;
		case 'random': {
			gameData.teamSelectionVotes.random.count++;
			gameData.teamSelectionVotes.random.users.push(interaction.user.id);
		} break;
		case 'captains': {
			gameData.teamSelectionVotes.captains.count++;
			gameData.teamSelectionVotes.captains.users.push(interaction.user.id);
		} break;
		default: break;
		}

		for (const option in gameData.teamSelectionVotes) {
			if (option === gameData.teamSelectionVotes[gameData.teamSelection]) continue;

			const count = gameData.teamSelectionVotes[option].count;
			if (count > gameData.teamSelectionVotes[gameData.teamSelection].count) {
				gameData.teamSelection = option;
			}
		}

		if (
			gameData.teamSelectionVotes.balanced.count + gameData.teamSelectionVotes.random.count >= Object.keys(gameData.players).length ||
            gameData.teamSelectionVotes.balanced.count >= (Object.keys(gameData.players).length / 2) ||
            gameData.teamSelectionVotes.random.count >= (Object.keys(gameData.players).length / 2) ||
            gameData.teamSelectionVotes.captains.count >= (Object.keys(gameData.players).length / 2)
		) {
			// finish the vote
			await gameData.startGame();
		}

		await gameData.getTeamSelectionMessageContent(true);
		await interaction.deferUpdate();
	},
};
