const { MessageEmbed } = require('discord.js');

const queueSettings = require('../data/queueSettings');
const queueData = require('../data/queueData');

const enterQueueCommand = require('../commands/enterQueue');
const generalData = require('../data/generalData');

const cConsole = require('../utils/customConsoleLog');
const clientSendMessage = require('../utils/clientSendMessage');
const embedUtilities = require('../utils/embedUtilities');

module.exports = {
	name: 'voiceStateUpdate',
	async execute(interaction, oldState) {
		const queueConfig = await queueSettings.getQueueDatabaseById(interaction.guild.id);
		const autoQueueChannels = {
			ones: queueConfig.channelSettings.autoQueue1VC,
			twos: queueConfig.channelSettings.autoQueue2VC,
			threes: queueConfig.channelSettings.autoQueue3VC,
		};
		if (Object.values(autoQueueChannels).includes(oldState.channelId)) { // Joined the VC
			if (await queueData.info.userReservedStatus(interaction.id) !== false) return;
			const targetLobby = Object.keys(autoQueueChannels)[Object.values(autoQueueChannels).indexOf(oldState.channelId)];

			if (enterQueueCommand.currentQueueMessage[targetLobby]) {
				await enterQueueCommand.currentQueueMessage[targetLobby].delete();
			}

			let response = (generalData.generalQueueSettings.pauseQueue) ? 'queuePaused' : await queueData.actions.addPlayerToQueue(null, targetLobby, interaction.id, queueConfig);
			let responseArgs = '';
			if (response.includes(':')) {
				const split = response.split(':');
				response = split[0];
				responseArgs = split[1];
				console.log(responseArgs);
			}
			const gameData = queueData.info.getGameDataById(responseArgs);

			if (response === 'queuePaused') {return;}
			else if (response !== 'gameStarted') {
				enterQueueCommand.currentQueueMessage[targetLobby] = await clientSendMessage.sendMessageTo(
					await queueSettings.getRankedLobbyByName(targetLobby, interaction.guild.id),
					{ embeds: [embedUtilities.presets.queueStatusEmbed(targetLobby, 'add', interaction)] },
				);
			}
			else {
				const embed = new MessageEmbed({
					title: 'Game has started!',
					color: '#00ff00',
					timestamp: new Date().getTime(),
				});

				if (gameData) {
					embed.description = gameData.getPlayersString(true);
				}
				else {
					cConsole.error('VoiceStateUpdate: Game data not found for game ID: ' + responseArgs);
				}

				await clientSendMessage.sendMessageTo(
					await queueSettings.getRankedLobbyByName(targetLobby, interaction.guild.id),
					{ embeds: [embed] },
				);
				enterQueueCommand.currentQueueMessage[targetLobby] = null;
			}

			await interaction.client.emit('queueEvent', interaction, 'add', queueData.info.getLobbyString(targetLobby));
		}
		else if (Object.values(autoQueueChannels).includes(interaction.channelId)) { // Left the VC
			if (await queueData.info.userReservedStatus(interaction.id) !== 'inQueue') return;
			const targetLobby = Object.keys(autoQueueChannels)[Object.values(autoQueueChannels).indexOf(interaction.channelId)];

			queueData.actions.removePlayerFromQueue(interaction, targetLobby);
			await clientSendMessage.sendMessageTo(
				await queueSettings.getRankedLobbyByName(targetLobby, interaction.guild.id),
				{ embeds: [embedUtilities.presets.queueStatusEmbed(targetLobby, 'removed', interaction)] },
			);
			await interaction.client.emit('queueEvent', interaction, 'removed', queueData.info.getLobbyString(targetLobby));
		}
	},
};
