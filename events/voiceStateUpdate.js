const queueSettings = require('../data/queueSettings');
const queueData = require('../data/queueData');

const cConsole = require('../utils/customConsoleLog');
const clientSendMessage = require('../utils/clientSendMessage');
const embedUtilities = require('../utils/embedUtilities');

module.exports = {
    name: 'voiceStateUpdate',
    async execute(interaction, oldState, newState) {
        const queueConfig = await queueSettings.getQueueDatabaseById(interaction.guild.id);
        const autoQueueChannels = {
            ones: queueConfig.channelSettings.autoQueue1VC,
            twos: queueConfig.channelSettings.autoQueue2VC,
            threes: queueConfig.channelSettings.autoQueue3VC,
        }
        if (Object.values(autoQueueChannels).includes(oldState.channelId)) {
            if (await queueData.info.userReservedStatus(interaction.id) != false) return;
            const targetLobby = Object.keys(autoQueueChannels)[Object.values(autoQueueChannels).indexOf(oldState.channelId)]

            queueData.actions.addPlayerToQueue(null, targetLobby, interaction.id, queueConfig);
            clientSendMessage.sendMessageTo(
                await queueSettings.getRankedLobbyByName(targetLobby, interaction.guild.id), 
                {embeds: [embedUtilities.presets.queueStatusEmbed(targetLobby, 'add', interaction)]}
            )
            await interaction.client.emit('queueEvent', interaction, 'add', queueData.info.getLobbyString(targetLobby));
        }
        else if (Object.values(autoQueueChannels).includes(interaction.channelId)) {
            if (await queueData.info.userReservedStatus(interaction.id) != 'inQueue') return;
            const targetLobby = Object.keys(autoQueueChannels)[Object.values(autoQueueChannels).indexOf(interaction.channelId)]

            queueData.actions.removePlayerFromQueue(interaction, targetLobby);
            clientSendMessage.sendMessageTo(
                await queueSettings.getRankedLobbyByName(targetLobby, interaction.guild.id), 
                {embeds: [embedUtilities.presets.queueStatusEmbed(targetLobby, 'removed', interaction)]}
            )
            await interaction.client.emit('queueEvent', interaction, 'removed', queueData.info.getLobbyString(targetLobby));
        }
    }
}