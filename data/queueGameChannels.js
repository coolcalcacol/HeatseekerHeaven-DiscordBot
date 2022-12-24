const { Permissions } = require('discord.js');

//#region Data
const QueueConfig = require('./database/queueConfigStorage');
const QueueDatabase = require('./database/queueDataStorage');
const PlayerData = require('./playerData');
const generalData = require('./generalData');
const queueSettings = require('./queueSettings');
const queueData = require('./queueData');
const guildConfigStorage = require('../data/database/guildConfigStorage')
//#endregion

//#region Utillities
const clientSendMessage = require('../utils/clientSendMessage');
const embedUtilities = require('../utils/embedUtilities');
const cConsole = require('../utils/customConsoleLog');
const generalUtilities = require('../utils/generalUtilities');
//#endregion
const botUpdate = require('../events/botUpdate');

async function createGameChannels(gameData = new queueData.info.GameLobbyData()) {
    const guild = await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
    const queueConfig = await queueSettings.getQueueDatabaseById(generalData.botConfig.defaultGuildId);
    const guildConfig = await guildConfigStorage.findOne({_id: generalData.botConfig.defaultGuildId}).catch(console.error);
    gameData.channels.category = await guild.channels.cache.find(c => c.id == queueConfig.channelSettings.teamChannelCategory);

    const adminRoles = guildConfig.adminRoles;
    const defaultChannelPermissions = [
        {
            id: guild.id,
            deny: ['VIEW_CHANNEL']
        }
    ];
    for (const adminRole in adminRoles) {
        const roleId = adminRoles[adminRole].id;
        defaultChannelPermissions.push({
            id: roleId,
            allow: ['CONNECT', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'USE_APPLICATION_COMMANDS', 'READ_MESSAGE_HISTORY']
        })
    }

    gameData.channelPermissions.default = defaultChannelPermissions.concat();
    gameData.channelPermissions.gameChat = defaultChannelPermissions.concat();
    gameData.channelPermissions.blue = defaultChannelPermissions.concat();
    gameData.channelPermissions.orange = defaultChannelPermissions.concat();

    // const channelPermissions = {
    //     gameChat: defaultChannelPermissions.concat(),
    //     blue: defaultChannelPermissions.concat(),
    //     orange: defaultChannelPermissions.concat(),
    // };

    for (const player in gameData.players) {
        const user = await generalUtilities.info.getUserById(player);
        gameData.channelPermissions.gameChat.push({
            id: user.id,
            allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'USE_APPLICATION_COMMANDS', 'READ_MESSAGE_HISTORY']
        });
    }

    for (const team in gameData.teams) {
        for (const player in gameData.teams[team].members) {
            const user = await generalUtilities.info.getUserById(player);
            const otherTeam = team == 'blue' ? 'orange' : 'blue';

            gameData.channelPermissions.gameChat.push({
                id: user.id,
                allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'USE_APPLICATION_COMMANDS', 'READ_MESSAGE_HISTORY']
            });
            gameData.channelPermissions[team].push({
                id: user.id,
                allow: ['CONNECT', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'USE_APPLICATION_COMMANDS', 'READ_MESSAGE_HISTORY']
            });
            gameData.channelPermissions[otherTeam].push({
                id: user.id, 
                allow: ['VIEW_CHANNEL'],
                deny: ['CONNECT']
            });
        }
    }

    const channelTopic = `id:${gameData.gameId}_lobby:${gameData.lobby}_created:${new Date().getTime()}`; //replace with team vc id's
    gameData.channels.gameChat = await guild.channels.create(`hs${gameData.gameId}-gamechat`, {
        type: 'GUILD_TEXT',
        parent: gameData.channels.category,
        topic: channelTopic,
        permissionOverwrites: gameData.channelPermissions.gameChat,
    }).catch(console.error);
    
    //Send an info message explaining why the main queue channels are not visable anymore and how to gain access back
    clientSendMessage.sendMessageTo(
        gameData.channels.gameChat.id, 
        [
            `This channel is created for game \`${gameData.gameId}\` and 2 voice channels for each team;`,
            `Team Blue: \`hs${gameData.gameId} | Blue\``,
            `Team Orange: \`hs${gameData.gameId} | Orange\``,
            `The main ranked channels will be hidden for everyone in this game lobby until you report the game.`,
            `If you experiance any problems with during this game, ask help from the \`@Bot Admins\` in this chat.`
        ].join('\n')
    );

    //#region Timers
        // Send the queue starting message again in the created game chat
        if (gameData.channels.gameChat) {
            new botUpdate.UpdateTimer(
                'queueStartMessage' + gameData.channels.gameChat.id, 
                new Date().setSeconds(new Date().getSeconds() + ((generalData.debugMode) ? 0 : 2)),
                gameData.onGameChatCreated.bind(gameData)
            );
        }
        
        // Add the InGame role to the players
        new botUpdate.UpdateTimer(
            'managePerms' + gameData.channels.gameChat.id, 
            new Date().setSeconds(new Date().getSeconds() + ((generalData.debugMode) ? 1 : 12)),
            manageChannelPermissions.bind(this, false, gameData)
        );
    
        // After 30 minutes, force the channels to be deleted if the game is still active and give back the perms to the players
        // !! Doesnt cancel the game and doesnt remove the in game role
        // new botUpdate.UpdateTimer(
        //     '30minDeleteChannels' + gameData.channels.gameChat.id, 
        //     new Date().setMinutes(new Date().getSeconds() + 15), 
        //     deleteGameChannels.bind(this, gameData)
        // );
        
        // new botUpdate.UpdateTimer(gameData.channels.gameChat.topic, new Date().setSeconds(new Date().getSeconds() + 10), deleteGameChannels.bind(this, gameData))
    //#endregion
}

async function createVoiceChannels(gameData = new queueData.info.GameLobbyData()) {
    const queueConfig = await queueSettings.getQueueDatabaseById(generalData.botConfig.defaultGuildId);
    const guild = await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
    
    // Set the channel permissions
    for (const team in gameData.teams) {
        for (const player in gameData.teams[team].members) {
            const user = await generalUtilities.info.getUserById(player);
            const otherTeam = team == 'blue' ? 'orange' : 'blue';

            gameData.channelPermissions[team].push({
                id: user.id,
                allow: ['CONNECT', 'VIEW_CHANNEL', 'SEND_MESSAGES', 'USE_APPLICATION_COMMANDS', 'READ_MESSAGE_HISTORY']
            });
            gameData.channelPermissions[otherTeam].push({
                id: user.id, 
                allow: ['VIEW_CHANNEL'],
                deny: ['CONNECT']
            });
        }
    }

    // create team VC's
    gameData.channels.blue = await guild.channels.create(`hs${gameData.gameId} | Blue`, {
        type: 'GUILD_VOICE',
        parent: gameData.channels.category,
        permissionOverwrites: gameData.channelPermissions.blue,
    }).catch(console.error)
    gameData.channels.orange = await guild.channels.create(`hs${gameData.gameId} | Orange`, {
        type: 'GUILD_VOICE',
        parent: gameData.channels.category,
        permissionOverwrites: gameData.channelPermissions.orange,
    }).catch(console.error);

    var autoQueueVC;
    const autoQueuePlayers = [];
    switch(gameData.lobby) {
        case 'ones': { autoQueueVC = await guild.channels.cache.get(queueConfig.channelSettings.autoQueue1VC); } break;
        case 'twos': { autoQueueVC = await guild.channels.cache.get(queueConfig.channelSettings.autoQueue2VC); } break;
        case 'threes': { autoQueueVC = await guild.channels.cache.get(queueConfig.channelSettings.autoQueue3VC); } break;
        default: break;
    }
    for (const team in gameData.teams) {
        autoQueueVC.members.map(async (member) => {
            if (Object.keys(gameData.teams[team].members).includes(member.id)) {
                autoQueuePlayers.push(member.id);
                await member.voice.setChannel(gameData.channels[team]);
            }
        });
    }
    gameData.channels.gameChat.setTopic(gameData.channels.gameChat.topic + `_AvoiceChannels:${gameData.channels.blue.id},${gameData.channels.orange.id}_AautoQueuePlayers:${autoQueuePlayers.join(',')}`);
}


async function deleteGameChannels(gameData) {
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
        var key = arg.split(':')[0];
        const value = arg.split(':')[1];
        if (key.split('')[0] == 'A') {
            const keySplit = key.split('');
            key = '';
            for (let k = 1; k < keySplit.length; k++) {
                const char = keySplit[k];
                key += char;
            }
            details[key] = value.split(',');
        }
        else { details[key] = value; }
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
                if (details.autoQueuePlayers.includes(member.id)) {
                    await member.voice.setChannel(autoQueueVC).catch(console.error);
                }
            }
        })).catch(console.error);
        await vc.delete().catch(console.error);
    }
    new botUpdate.UpdateTimer(channel.id, new Date().setMinutes(new Date().getMinutes() + 1), deleteGameChat.bind(this, channel))
}
async function deleteGameChat(channel) {
    if (!channel.id) return;
    try {await channel.delete();} catch(error) {}
}

async function manageChannelPermissions(reset, gameData, substituteData = {targetUser: {}, replaceUser: {}, targetTeam: ''}) {
    const guild = await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
    const queueConfig = await queueSettings.getQueueDatabaseById(generalData.botConfig.defaultGuildId);
    const guildConfig = await guildConfigStorage.findOne({_id: generalData.botConfig.defaultGuildId}).catch(console.error);

    // const targetChannels = [
    //     'onesChannel',
    //     'twosChannel',
    //     'threesChannel',
    //     'autoQueue1VC',
    //     'autoQueue2VC',
    //     'autoQueue3VC'
    // ]
    if (reset != 'substitute') {
        if (Object.keys(queueConfig.roleSettings.inActiveGameRole).length > 0) {
            const ingameRole = queueConfig.roleSettings.inActiveGameRole;
            for (const player in gameData.players) {
                // const user = await generalUtilities.info.getUserById(player);
                const memberData = await generalUtilities.info.getMemberById(player);
                var hasAdminRole = false;
                if (guildConfig) {
                    for (const adminRole in guildConfig.adminRoles) {
                        const roleId = guildConfig.adminRoles[adminRole].id;
                        if (memberData._roles.includes(roleId)) { hasAdminRole = true; break; }
                    }
                    if (hasAdminRole) continue;
                }
                if (memberData.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
                    continue;
                }
                // channel.permissionOverwrites.edit(user, {VIEW_CHANNEL: false});
                
                if (reset == false) {
                    memberData.roles.add(ingameRole.id).catch(console.error);
                }
                else if (reset == true) {
                    memberData.roles.remove(ingameRole.id).catch(console.error);
                }
            }
            
        }
        // for (const target in targetChannels) {
        //    const channel = await guild.channels.cache.get(queueConfig.channelSettings[targetChannels[target]])
        // }
    }
    else if (reset == 'substitute' && Object.keys(substituteData.targetUser).length > 0 && Object.keys(substituteData.replaceUser).length > 0) {
        const targetUser = substituteData.targetUser;
        const replaceUser = substituteData.replaceUser;
        const targetMemberData = await generalUtilities.info.getMemberById(targetUser.id);
        const replaceMemberData = await generalUtilities.info.getMemberById(replaceUser.id);
        const targetTeam = substituteData.targetTeam;
        const otherTeam = targetTeam == 'blue' ? 'orange' : 'blue';
        const inActiveGameRole = queueConfig.roleSettings.inActiveGameRole;

        console.log('targetUser: ' + targetUser.username);
        console.log('replaceUser: ' + replaceUser.username);
        console.log('targetTeam: ' + targetTeam);
        console.log('otherTeam: ' + otherTeam);

        gameData.channels.gameChat.permissionOverwrites.edit(replaceUser, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
            USE_APPLICATION_COMMANDS: true,
            READ_MESSAGE_HISTORY: true
        });
        gameData.channels[targetTeam].permissionOverwrites.edit(replaceUser, {
            CONNECT: true,
            VIEW_CHANNEL: true,
            SEND_MESSAGES: true,
            USE_APPLICATION_COMMANDS: true,
            READ_MESSAGE_HISTORY: true,
        });
        gameData.channels[otherTeam].permissionOverwrites.edit(replaceUser, {
            CONNECT: false,
            VIEW_CHANNEL: true,
        });

        for (const c in gameData.channels) {
            const targetChannel = gameData.channels[c];
            const perms = await targetChannel.permissionOverwrites.cache.get(targetUser.id)
            if (!perms) continue;
            try { await perms.delete(); } 
            catch (error) { console.error(error); }
        }

        if (targetMemberData._roles.includes(inActiveGameRole.id)) {
            targetMemberData.roles.remove(inActiveGameRole.id).catch(console.error);
        }
        if (!replaceMemberData._roles.includes(inActiveGameRole.id)) {
            replaceMemberData.roles.add(inActiveGameRole.id).catch(console.error);
        }

        // for (const target in targetChannels) {
        //     const channel = await guild.channels.cache.get(queueConfig.channelSettings[targetChannels[target]])
        //     const perms = await channel.permissionOverwrites.cache.get(targetUser.id)

        //     await channel.permissionOverwrites.edit(replaceUser, {VIEW_CHANNEL: false});
        //     if (!perms) continue;
        //     try { await perms.delete(); } 
        //     catch (error) { console.error(error); }
        // }
    }
}


module.exports = {
    createGameChannels,
    createVoiceChannels,
    deleteGameChannels,
    manageChannelPermissions
}