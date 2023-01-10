const { SlashCommandBuilder } = require('@discordjs/builders');

const reportCommand = require('../../reportGame');
const mmrCalculator = require('../../../data/mmrCalculator');
const playerData = require('../../../data/playerData');
const QueueConfig = require('../../../data/database/queueConfigStorage');
const queueSettings = require('../../../data/queueSettings');
const queueData = require('../../../data/queueData');
const embedUtilities = require('../../../utils/embedUtilities');
const clientSendMessage = require('../../../utils/clientSendMessage');
const generalData = require('../../../data/generalData');
const queueGameChannels = require('../../../data/queueGameChannels');


const cConsole = require('../../../utils/customConsoleLog');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('report_select'),
	async execute(interaction) {
		const report = reportCommand.reportData[interaction.customId.split('_')[2]];
		const gameData = report.gameData;

		let targetTeam; // The team that the reporter is a part of
		let opponentTeam; // The opposite team;
		let targetTeamName;
		let opponentTeamName;
		for (const team in gameData.teams) {
			for (const data in gameData.teams[team].members) {
				const player = gameData.teams[team].members[data];
				if (player['_id'] === interaction.user.id) {
					// this.gameData = gameData;
					targetTeam = gameData.teams[team];
					targetTeamName = team;
					opponentTeam = team === 'blue' ? gameData.teams['orange'] : gameData.teams['blue'];
					opponentTeamName = team === 'blue' ? 'orange' : 'blue';
					break;
				}
			}
			if (targetTeam != null) break;
		}
		if (!targetTeam) {
			await interaction.reply({
				ephemeral: true,
				content: 'This game report is not meant for you...',
			}).catch(console.error);
			// currentReply = await interaction.fetchReply();
			return;
		}

		if (gameData.reportStatus) {
			await interaction.reply({
				ephemeral: true,
				content: 'This game is already reported',
			}).catch(console.error);
			// currentReply = await interaction.fetchReply();
			return;
		}

		gameData.reportStatus = true;
		const queueSettingsData = await queueSettings.getQueueDatabaseById(interaction.guild.id, true);

		try {
			const gameResults = await interaction.values[0] === 'game_won' ?
				mmrCalculator.getGameResults(targetTeam, opponentTeam, gameData, queueSettingsData.mmrSettings) :
				mmrCalculator.getGameResults(opponentTeam, targetTeam, gameData, queueSettingsData.mmrSettings) ;
			const winningTeamName = interaction.values[0] === 'game_won' ? targetTeamName : opponentTeamName;


			const storedQueueData = await QueueConfig.findOne({});
			if (storedQueueData.channelSettings.matchReportChannel !== '') {
				await clientSendMessage.sendMessageTo(storedQueueData.channelSettings.matchReportChannel, {
					embeds: [embedUtilities.presets.gameResultPreset(gameData, gameResults, interaction.user, winningTeamName)],
					components: [],
				}).catch(console.error);
			}

			await interaction.update({
				embeds: [embedUtilities.presets.gameResultPreset(gameData, gameResults, interaction.user, winningTeamName)],
				components: [],
			}).catch(console.error);


			gameData.gameResults = gameResults;
			queueData.info.globalQueueData.gameHistory.push(gameData);

			const inProgressList = queueData.info.globalQueueData.gamesInProgress;
			thisLog({ inProgress: inProgressList });
			// queueData.info.globalQueueData.gamesInProgress.splice(inProgressList.indexOf(item => item.gameId == gameData.gameId) + 1, 1);
			for (let i = 0; i < inProgressList.length; i++) {
				const game = inProgressList[i];
				if (game.gameId === gameData.gameId) {
					thisLog('splicing: ' + game.gameId + ' | index: ' + i + ' of ' + inProgressList.length);
					queueData.info.globalQueueData.gamesInProgress.splice(i, 1);
					break;
				}
			}

			delete reportCommand.reportData[gameData.gameId];

			await playerData.updatePlayerRanks(interaction.guild.id);
			await queueGameChannels.deleteGameChannels(gameData);

			// new botUpdate.UpdateTimer(`DebugLogStats_${gameData.gameId}`, new Date(new Date().setSeconds(new Date().getSeconds() + 1)).getTime(), this.debugLogStats.bind(this.debugLogStats,
			//     ['global', 'persistent'],
			//     [await playerData.getPlayerDataById(targetTeam.members[Object.keys(targetTeam.members)[0]]._id), await playerData.getPlayerDataById(opponentTeam.members[Object.keys(opponentTeam.members)[0]]._id)],
			//     interaction.channel.id
			// ));
		}
		catch (err) {
			console.error(err);
		}

		// await interaction.update({
		//     ephemeral: true,
		//     embeds: embed,
		//     components: []
		// }).catch(console.error);
		// return;
	},

	/**
	 * @param {Array} modes
	 * @param {Array} players
	 * @param channelId
	 */
	async debugLogStats(modes, players, channelId = '842093944502616104') {
		const embeds = [];
		for (const player of players) {
			for (const mode of modes) {
				embeds.push(embedUtilities.presets.playerStatsPreset(player, mode));
			}
		}
		await clientSendMessage.sendMessageTo(channelId, {
			embeds: embeds,
		}).catch(console.error);
	},
};

function thisLog(message) {
	if (!generalData.logOptions.gameReport) return;
	if (typeof message === 'object') {
		cConsole.log('--------[fg=green]Report Select[/>]--------');
		console.log(message);
	}
	else {
		cConsole.log('[fg=green]Report Select[/>]: ' + message);
	}
}
