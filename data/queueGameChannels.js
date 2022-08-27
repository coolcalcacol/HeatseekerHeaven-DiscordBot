//#region Data
const QueueConfig = require('./database/queueConfigStorage');
const QueueDatabase = require('./database/queueDataStorage');
const PlayerData = require('./playerData');
const generalData = require('./generalData');
const queueSettings = require('./queueSettings');
const queueData = require('./queueData');
//#endregion

//#region Utillities
const clientSendMessage = require('../utils/clientSendMessage');
const embedUtilities = require('../utils/embedUtilities');
const cConsole = require('../utils/customConsoleLog');
const generalUtilities = require('../utils/generalUtilities');
const sleep = require('node:timers/promises').setTimeout;
//#endregion
const botUpdate = require('../events/botUpdate');

async function createGameChannels(gameData = new queueData.info.GameLobbyData()) {
    const guild = await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
    const queueConfig = await queueSettings.getQueueDatabaseById(generalData.botConfig.defaultGuildId);
    const parent = await guild.channels.cache.find(c => c.id == queueConfig.channelSettings.teamChannelCategory);
    const defaultChannelPermissions = {id: guild.id, deny: ['VIEW_CHANNEL']};
    const channelPermissions = {
        gameChat: [defaultChannelPermissions],
        blue: [defaultChannelPermissions],
        orange: [defaultChannelPermissions],
    };

    
    // create team VC's
    gameData.channels.blue = await guild.channels.create(`hs${gameData.gameId} | Blue`, {
        type: 'GUILD_VOICE',
        parent: parent,
        permissionOverwrites: channelPermissions.blue,
    }).catch(console.error)
    gameData.channels.orange = await guild.channels.create(`hs${gameData.gameId} | Orange`, {
        type: 'GUILD_VOICE',
        parent: parent,
        permissionOverwrites: channelPermissions.orange,
    }).catch(console.error);

    const channelTopic = `id:${gameData.gameId}_voiceChannels:${gameData.channels.blue.id},${gameData.channels.orange.id}_lobby:${gameData.lobby}_created:${new Date().getTime()}`; //replace with team vc id's
    gameData.channels.gameChat = await guild.channels.create(`hs${gameData.gameId}-gamechat`, {
        type: 'GUILD_TEXT',
        parent: parent,
        topic: channelTopic,
        permissionOverwrites: channelPermissions.gameChat,
    }).catch(console.error);

    for (const team in gameData.teams) {
        for (const player in gameData.teams[team].members) {
            const user = await generalUtilities.info.getUserById(player);
            const otherTeam = team == 'blue' ? 'orange' : 'blue';

            gameData.channels.gameChat.permissionOverwrites.edit(user, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                READ_MESSAGE_HISTORY: true
            });
            gameData.channels[team].permissionOverwrites.edit(user, {
                CONNECT: true,
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                READ_MESSAGE_HISTORY: true,
            });
            gameData.channels[otherTeam].permissionOverwrites.edit(user, {
                CONNECT: false,
                VIEW_CHANNEL: true,
            });
            // channelPermissions.gameChat.push({
            //     id: user,
            //     allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
            // });
            // channelPermissions[team].push({
            //     id: user,
            //     allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'CONNECT', 'READ_MESSAGE_HISTORY']
            // });
            // channelPermissions[otherTeam].push({
            //     id: user,
            //     allow: ['VIEW_CHANNEL'],
            //     deny: ['CONNECT']
            // });
        }
    }

    var autoQueueVC;
    switch(gameData.lobby) {
        case 'ones': { autoQueueVC = await guild.channels.cache.get(queueConfig.channelSettings.autoQueue1VC); } break;
        case 'twos': { autoQueueVC = await guild.channels.cache.get(queueConfig.channelSettings.autoQueue2VC); } break;
        case 'threes': { autoQueueVC = await guild.channels.cache.get(queueConfig.channelSettings.autoQueue3VC); } break;
        default: break;
    }
    for (const team in gameData.teams) {
        autoQueueVC.members.map(async (member) => {
            if (Object.keys(gameData.teams[team].members).includes(member.id)) {
                await member.voice.setChannel(gameData.channels[team]);
            }
        });
    }
    manageChannelPermissions(false, gameData);

    // new botUpdate.UpdateTimer(gameData.channels.gameChat.topic, new Date().setSeconds(new Date().getSeconds() + 10), deleteGameChannels.bind(this, gameData))
    new botUpdate.UpdateTimer(gameData.channels.gameChat.id, new Date().setMinutes(new Date().getMinutes() + 30), deleteGameChannels.bind(this, gameData.channels.gameChat))
}

async function deleteGameChannels(gameData = new queueData.info.GameLobbyData()) {
    const channel = gameData.channels.gameChat;
    const guild = await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
    if (!await guild.channels.cache.get(channel.id)) {
        cConsole.log(`Channel: ${channel.id} of game ${gameData.gameId} Does not exist`); 
        return;
    }

    const queueConfig = await queueSettings.getQueueDatabaseById(generalData.botConfig.defaultGuildId);
    const topicSplit = channel.topic.split('_');
    const details = {};
    for (let i = 0; i < topicSplit.length; i++) {
        const arg = topicSplit[i];
        const key = arg.split(':')[0];
        const value = arg.split(':')[1];
        details[key] = value.split(',').length > 1 ? value.split(',') : value;
    }
    manageChannelPermissions(true, gameData);

    var autoQueueVC;
    switch(details.lobby) {
        case 'ones': { autoQueueVC = await guild.channels.cache.get(queueConfig.channelSettings.autoQueue1VC); } break;
        case 'twos': { autoQueueVC = await guild.channels.cache.get(queueConfig.channelSettings.autoQueue2VC); } break;
        case 'threes': { autoQueueVC = await guild.channels.cache.get(queueConfig.channelSettings.autoQueue3VC); } break;
        default: break;
    }

    for (const v in details.voiceChannels) {
        const vc = await guild.channels.cache.get(details.voiceChannels[v]);
        if (!vc) continue;
        await Promise.all(vc.members.map(async (member) => {
            if (member.voice.channel.id == vc.id) {
                await member.voice.setChannel(autoQueueVC).catch(console.error);
            }
        })).catch(console.error);
        await vc.delete().catch(console.error);
    }
    new botUpdate.UpdateTimer(channel.id, new Date().setMinutes(new Date().getMinutes() + 1), deleteGameChat.bind(this, channel))
}
async function deleteGameChat(channel) {
    if (!channel) return;
    await channel.delete();
}

async function manageChannelPermissions(reset, gameData = new queueData.info.GameLobbyData()) {
    const guild = await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
    const queueConfig = await queueSettings.getQueueDatabaseById(generalData.botConfig.defaultGuildId);
    const targetChannels = [
        'onesChannel',
        'twosChannel',
        'threesChannel',
        'autoQueue1VC',
        'autoQueue2VC',
        'autoQueue3VC'
    ]
    for (const target in targetChannels) {
        const channel = await guild.channels.cache.get(queueConfig.channelSettings[targetChannels[target]])
        if (!reset) {
            for (const player in gameData.players) {
                const user = await generalUtilities.info.getUserById(player);
                channel.permissionOverwrites.edit(user, {VIEW_CHANNEL: false});
            }
        }
        else {
            for (const player in gameData.players) {
                const perms = await channel.permissionOverwrites.cache.get(player);
                await perms.delete();
            }
        }
    }
}


module.exports = {
    createGameChannels,
    deleteGameChannels
}