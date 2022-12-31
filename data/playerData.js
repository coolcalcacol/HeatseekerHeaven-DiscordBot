const GeneralData = require('./generalData');
const PlayerDatabase = require('./database/playerDataStorage');
const QueueDatabase = require('./database/queueConfigStorage');
const queueSettings = require('../data/queueSettings');
const guildSettings = require('./database/guildConfigStorage');
const generalData = require('./generalData');
const generalUtilities = require('../utils/generalUtilities');
const cConsole = require('../utils/customConsoleLog');
const clientSendMessage = require('../utils/clientSendMessage');
const { clearPlayerDataPass } = require('../config/private.json');


async function createPlayerData(userData, queueSettingsData) {
    var output;
    const newData = await getPlayerDataObject(userData, queueSettingsData);
    await PlayerDatabase.insertMany(newData)
        .then((result) => {
            if (GeneralData.logOptions.getPlayerData) {
                cConsole.log('New PlayerData created for: [fg=green]' + newData.userData.name + '[/>]');
                console.log(result[0]);
            }
            output = result[0];
        })
        .catch((err) => {console.log(err);});
    return output;
}
async function updatePlayerData(data, equationValues, undo = false) {
    const user = await generalUtilities.info.getUserById(data['_id']);
    const newData = await getPlayerDataObject(user, {mmrSettings: equationValues});
    newData.persistentStats = JSON.parse(JSON.stringify(data.persistentStats));
    const gameModes = ['ones', 'twos', 'threes', 'global']
    
    for (let i = 0; i < gameModes.length; i++) {
        const mode = gameModes[i];
        
        newData.stats[mode].mmr = (mode == 'global') ? 0 : (data.stats[mode].mmr) ? data.stats[mode].mmr : equationValues.startingMmr;
        newData.stats[mode].gamesPlayed = (data.stats[mode].gamesPlayed) ? data.stats[mode].gamesPlayed : 0;
        newData.stats[mode].gamesWon = (data.stats[mode].gamesWon) ? data.stats[mode].gamesWon : 0;
        newData.stats[mode].gamesLost = (data.stats[mode].gamesLost) ? data.stats[mode].gamesLost : 0;
        newData.stats[mode].winRate = (data.stats[mode].winRate) ? data.stats[mode].winRate : 0;
    }
    for (let i = 0; i < gameModes.length; i++) {
        const mode = gameModes[i];
        if (mode == 'global') continue;
        thisLog(`${newData.stats.global.mmr} += ${data.stats[mode].mmr} * ${equationValues[mode + 'Multiplier']} = ${newData.stats.global.mmr + data.stats[mode].mmr * equationValues[mode + 'Multiplier']}`)
        newData.stats.global.mmr += data.stats[mode].mmr * equationValues[mode + 'Multiplier'];
    }

    let currentGain = newData.stats.global.mmr - data.stats.global.mmr;
    thisLog(`\nCurrent Gain: ${newData.stats.global.mmr} - ${data.stats.global.mmr} = ${currentGain}`);
    if (!undo && !equationValues.placementSettings.modeBased && data.stats.global.gamesPlayed < equationValues.placementSettings.gameCount) {
        thisLog(`Placement Gain: ${currentGain} * (${equationValues.placementSettings.gain} - (${data.stats.global.gamesPlayed} / ${equationValues.placementSettings.gameCount}) * (${equationValues.placementSettings.gain} - 1)) = ${currentGain * (equationValues.placementSettings.gain - (data.stats.global.gamesPlayed / equationValues.placementSettings.gameCount) * (equationValues.placementSettings.gain - 1))}\n`);
        currentGain = currentGain * (equationValues.placementSettings.gain - (data.stats.global.gamesPlayed / equationValues.placementSettings.gameCount) * (equationValues.placementSettings.gain - 1));
    }
    newData.stats.global.mmr = Math.round(data.stats.global.mmr + currentGain);
    newData.persistentStats.totalMmr += newData.stats.global.mmr;
    newData.persistentStats.averageMmr = Math.round(newData.persistentStats.totalMmr / newData.persistentStats.gamesPlayed);

    const perStatsDebug = {}
    for (const perStats in newData.persistentStats) {
        if (!['averageMmr', 'totalMmr'].includes(perStats)) continue;
        perStatsDebug[perStats] = `[fg=red]${data.persistentStats[perStats]}[/>] -> [fg=green]${newData.persistentStats[perStats]}[/>] ([fg=yellow]${newData.persistentStats[perStats] - data.persistentStats[perStats]}[/>])`;
    }
    thisLog(`---- [fg=green]${data.userData.name}[/>] [fg=yellow]Player Data[/>] ----`);
    thisLog(perStatsDebug);

    newData['__v'] = (data['__v'] + 1);
    await PlayerDatabase.updateMany({_id: data['_id']}, newData);
}
async function updatePlayerRanks(guildId) {
    const queueSettingsData = await QueueDatabase.findOne({_id: guildId}).catch(console.error);
    const rankData = await queueSettingsData.rankRoles.global;
    const playerData = await PlayerDatabase.find({"userData.isMember": true}).sort({
        "stats.global.mmr": -1, 
        "stats.global.winRate": -1, 
        "stats.global.gamesPlayed": -1
    });
    // const debug = generalData.debugMode;
    const debug = false;

    var spliceStart = 0;
    var spliceEnd;
    var remainingPlayers = playerData.concat();
    for (let i = 0; i < rankData.length; i++) {
        const rank = rankData[i];
        const dist = rank.distribution;
        
        var effectedPlayers = [];

        if (dist == 'top') {
            effectedPlayers = getRankEffectedPlayers(playerData, 0, 10, rank.requirements);
            for (let e = 0; e < effectedPlayers.length; e++) {
                const player = effectedPlayers[e];
                playerData.splice(playerData.indexOf(player), 1);
                remainingPlayers.splice(remainingPlayers.indexOf(player), 1)
            }
            // effectedPlayers = playerData.splice(0, 10);
        }
        else if (dist.split('').includes('%')) {
            const percent = parseInt(dist.replace('%', ''));
            
            spliceEnd = Math.round((percent / 100) * (playerData.length - 1));
            effectedPlayers = getRankEffectedPlayers(remainingPlayers, 0, spliceEnd + 1, rank.requirements);
            // effectedPlayers = playerData.concat().splice(spliceStart, spliceEnd + 1);
            for (let e = 0; e < effectedPlayers.length; e++) {
                const player = effectedPlayers[e];
                remainingPlayers.splice(remainingPlayers.indexOf(player), 1)
            }
            spliceStart += spliceEnd + 1;
        }
        else if (dist == 'meet-requirements') {
            effectedPlayers = getRankEffectedPlayers(remainingPlayers, 0, spliceEnd + 1, rank.requirements);
            for (let e = 0; e < effectedPlayers.length; e++) {
                const player = effectedPlayers[e];
                remainingPlayers.splice(remainingPlayers.indexOf(player), 1)
            }
            // remainingPlayers = playerData.concat().splice(spliceStart, spliceEnd + 1);
            // for (let r = 0; r < remainingPlayers.length; r++) {
            //     const player = remainingPlayers[r];
            //     for (const req in rank.requirements) {
            //         const value = rank.requirements[req];
            //         if (value == '-1') continue;
            //         if (player.stats.global[req] >= value) {
            //             effectedPlayers.push(player)
            //         }
            //     }
            // }
            // for (let efect = 0; efect < effectedPlayers.length; efect++) {
            //     const player = effectedPlayers[efect];
            //     remainingPlayers.splice(remainingPlayers.indexOf(player), 1);
            // }
        }
        
        thisLog('\n---- [fg=green]' + dist + '[/>] ---- [' + effectedPlayers.length + ' | ' + spliceStart + ' | ' + spliceEnd +']');
        for (const effected in effectedPlayers) {
            const player = effectedPlayers[effected];
            if (!player.userData.isMember) { continue; }
            thisLog(player.userData.name);
            if (!debug && player.stats.global.rank != rank.role) {
                const memberData = await generalUtilities.info.getMemberById(player['_id']);
                if (!memberData) continue;
                for (let r = 0; r < rankData.length; r++) {
                    const rRank = rankData[r];
                    if (rRank.role == rank.role) continue;
                    if (memberData._roles.includes(rRank.role.id)) {
                        memberData.roles.remove(rRank.role.id);
                    }
                }
                memberData.roles.add(rank.role.id);
                player.stats.global.rank = rank.role;
                await PlayerDatabase.updateOne({_id: player['_id']}, player);
            }
        }
    }

    thisLog('\n---- [fg=green]Unranked[/>] ----');
    for (const remaining in remainingPlayers) {
        const player = remainingPlayers[remaining];
        if (!player.userData.isMember) { continue; }
        thisLog(player.userData.name);
        if (!debug) {
            const memberData = await generalUtilities.info.getMemberById(player['_id']);
            if (!memberData) continue;
            for (let r = 0; r < rankData.length; r++) {
                const rRank = rankData[r];
                if (memberData._roles.includes(rRank.role.id)) {
                    memberData.roles.remove(rRank.role.id);
                }
            }
            player.stats.global.rank = null;
            PlayerDatabase.updateOne({_id: player['_id']}, player);
        }
    }
    thisLog('');
}
function getRankEffectedPlayers(list, start, count, requirements) {
    var output = [];
    var validRequirements = false;
    for (const req in requirements) {if (requirements[req] != '-1') {validRequirements = true; break;}}
    for (let i = start; i < count; i++) {
        if (i >= list.length) break;
        const player = list[i];
        if (validRequirements) {
            var validPlayer = true;
            for (const req in requirements) {
                const value = requirements[req];
                if (value == '-1') continue;
                if (player.stats.global[req] < value) {
                    validPlayer = false;
                    break;
                }
            }
            if (validPlayer) {
                output.push(player)
            }
            else {
                count++;
            }
        }
        else {
            output.push(player);
        }
    }
    return output;
}


/**
 * @param {String} id The user id of the userdata to get
 * @param {Boolean} createIfNull Create if the player data doesnt exist
 * @param {Object} queueSettingsData If [createIfNull] is True, pass in the relevant queueSettings for this guild
*/
async function getPlayerDataById(id, createIfNull = false, queueSettingsData) {
    var output;
    await PlayerDatabase.findById(id)
        .then(async (result) => {
            if (result) {
                if (GeneralData.logOptions.getPlayerData) {
                    console.log('Found player data');
                    console.log(result);
                }
                output = result;
            }
        })
        .catch((err) => {console.log(err)});
    if (!output && createIfNull) {
        const userData = await generalUtilities.info.getUserById(id);
        thisLog('Creating data for: [fg=green]' + userData.username + '[/>]');
        await createPlayerData(userData, queueSettingsData)
            .then((createdData) => { output = createdData; })
            .catch(console.error);
        return output;
    }
    else {
        return output;
    }
}

async function getPlayerDataObject(userData, queueSettingsData) { // The user data that discord generates for a user
    const memberData = await generalUtilities.info.getMemberById(userData.id).catch(console.error);
    if (!memberData) {
        cConsole.log(`ERROR: Could not get member data for ${userData.username}.\nPlease make sure that this user is still in the server`);
    }
    const forcedUserData = await userData.fetch(true);

    const startingMmr = queueSettingsData ? queueSettingsData.mmrSettings.startingMmr : null;
    const defualtStats = {
        mmr: startingMmr,
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        winRate: 0,
        rank: null,
    }

    const newData = new PlayerDatabase({
        _id: userData.id,
        userData: {
            name: userData.username,
            nickname: memberData ? memberData.nickname : userData.username,
            mention: `<@${userData.id}>`,
            discriminator: userData.discriminator,
            roles: memberData ? memberData._roles : [],
            displayColor: 
                forcedUserData.hexAccentColor ? 
                forcedUserData.hexAccentColor : memberData ? 
                memberData.displayHexColor : '#000000',
            avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=1024`,
            createdAt: new Date(userData.createdAt),
            joinedAt: memberData ? new Date(memberData.joinedAt) : new Date()
        },
    });
    if (startingMmr) {
        newData['stats'] = {
            global: defualtStats,
            ones: defualtStats,
            twos: defualtStats,
            threes: defualtStats,
        }
    }
    return newData;
}

async function resetPlayerStats(interaction, reason) {
    const queueConfig = await queueSettings.getQueueDatabaseById(interaction.guild.id);
    const guildData = await guildSettings.findOne({_id: interaction.guild.id}).catch(console.error);
    const playerDataList = await PlayerDatabase.find().catch(console.error);

    for (let i = 0; i < playerDataList.length; i++) {
        const data = playerDataList[i];
        for (const mode in data.stats) {
            const target = data.stats[mode];
            target.mmr = queueConfig.mmrSettings.startingMmr;
            target.gamesPlayed = 0;
            target.gamesWon = 0;
            target.gamesLost = 0;
            target.winRate = 0;
            target.rank = null;
        }
        await PlayerDatabase.updateOne({_id: data['_id']}, data)
    }
    updatePlayerRanks(interaction.guild.id);

    if (queueConfig.channelSettings.logChannel) {
        let adminRoleMention = '';
        for (const role in guildData.adminRoles) {
            adminRoleMention += role + ' ';
        }
        clientSendMessage.sendMessageTo(queueConfig.channelSettings.logChannel, [
            `${adminRoleMention}`,
            `**PlayerData has been __Reset__** by <@${interaction.user.id}>`,
            `user ID: \`${interaction.user.id}\``,
            `User Name: \`${interaction.user.username}#${interaction.user.discriminator}\``,
            `> Reason: \`${reason}\``
        ].join('\n'));
    }
}

async function clearPlayerData(interaction, password, reason) {
    const queueConfig = await queueSettings.getQueueDatabaseById(interaction.guild.id);
    const guildData = await guildSettings.findOne({_id: interaction.guild.id}).catch(console.error);
    let adminRoleMention = '';
    for (const role in guildData.adminRoles) {
        adminRoleMention += `${role} `;
    }
    console.log(guildData);
    if (password != clearPlayerDataPass) {
        const message = [
            `${adminRoleMention}`,
            `A user just tried to clear all of the PlayerData but didnt enter the correct password.`,
            `-------- User Info --------`,
            `${interaction.user.username}#${interaction.user.discriminator}`,
            `<@${interaction.user.id}> ${interaction.user.id}`
        ].join('\n');
        console.log(message);
        console.log(interaction);
        if (queueConfig.channelSettings.logChannel) {
            clientSendMessage.sendMessageTo(queueConfig.channelSettings.logChannel, message);
        }
        return false;
    }
    else {
        console.log(interaction); console.log('');
        console.log('Deleting PlayerData...'); console.log('');
        console.log(await PlayerDatabase.deleteMany({}));

        queueConfig.gameId = 100;
        queueSettings.updateQueueDatabase(queueConfig);

        if (queueConfig.channelSettings.logChannel) {
            clientSendMessage.sendMessageTo(queueConfig.channelSettings.logChannel, [
                `${adminRoleMention}`,
                `**PlayerData has been __Cleared__** by <@${interaction.user.id}>`,
                `user ID: \`${interaction.user.id}\``,
                `User Name: \`${interaction.user.username}#${interaction.user.discriminator}\``,
                `> Reason: \`${reason}\``
            ].join('\n'));
        }
        return true;
    }
}

function thisLog(log) {
    if (!generalData.logOptions.playerData) return;
    if (typeof log == "object") {
        console.log(log);
        console.log('');
    }
    else {
        cConsole.log(log)
    }
}

module.exports = {
    getPlayerDataById,
    createPlayerData,
    updatePlayerData,
    updatePlayerRanks,
    resetPlayerStats,
    clearPlayerData,
}