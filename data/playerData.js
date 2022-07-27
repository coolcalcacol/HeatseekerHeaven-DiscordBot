const GeneralData = require('./generalData');
const PlayerDataStorage = require('./database/playerDataStorage');
const queueSettings = require('../data/queueSettings');
const guildSettings = require('./database/guildSettings');
const generalData = require('./generalData');
const generalUtilities = require('../utils/generalUtilities');
const cConsole = require('../utils/customConsoleLog');
const clientSendMessage = require('../utils/clientSendMessage');
const { clearPlayerDataPass } = require('../config/private.json');

async function getPlayerDataById(id, createIfNull = false) {
    var output;
    await PlayerDataStorage.findById(id)
        .then(async (result) => {
            if (result) {
                if (GeneralData.logOptions.playerData) {
                    console.log('Found player data');
                    console.log(result);
                }
                output = result;
            }
        })
        .catch((err) => {console.log(err)});
    if (!output && createIfNull) {
        await createPlayerData(await generalUtilities.info.getUserById(id))
            .then((createdData) => {
                if (GeneralData.logOptions.playerData) console.log('Creating data');
                output = createdData;
            })
            .catch(console.error);
        return output;
    }
    else {
        return output;
    }
}
async function createPlayerData(userData) {
    var output;
    const newData = await getPlayerDataObject(userData);
    await PlayerDataStorage.insertMany(newData)
        .then((result) => {
            if (GeneralData.logOptions.playerData) {
                cConsole.log('New PlayerData created');
                console.log(result[0]);
            }
            output = result[0];
        })
        .catch((err) => {console.log(err);});
    return output;
}

async function updatePlayerData(data, equationValues) {
    const user = await generalUtilities.info.getUserById(data['_id']);
    const newData = await getPlayerDataObject(user);
    const gameModes = ['ones', 'twos', 'threes', 'global']
    
    for (let i = 0; i < gameModes.length; i++) {
        const mode = gameModes[i];
        
        newData.stats[mode].mmr = mode == 'global' ? 0 : data.stats[mode].mmr;
        newData.stats[mode].gamesPlayed = data.stats[mode].gamesPlayed;
        newData.stats[mode].gamesWon = data.stats[mode].gamesWon;
        newData.stats[mode].gamesLost = data.stats[mode].gamesLost;
        newData.stats[mode].winRate = data.stats[mode].winRate;
    }
    
    // (teamRatio - 0.5) * 2 + 0.5
    var globalEqLog = `${data.stats.global.mmr} + (`;
    var gameCountMultiplier = 0;
    for (let i = 0; i < gameModes.length; i++) {
        const mode = gameModes[i];
        if (mode == 'global') continue;
        
        const multiplier = mode == 'ones' ? 0.5 : mode == 'twos' ? 0.75 : 1;
        const mmrMultiplier = 
            mode == 'ones' ? 
                (data.stats.ones.mmr - equationValues.startingMmr) * 
                equationValues.onesMultiplier + equationValues.startingMmr : 
            mode == 'twos' ? 
                (data.stats.twos.mmr - equationValues.startingMmr) * 
                equationValues.twosMultiplier + equationValues.startingMmr : 
            (data.stats.threes.mmr - equationValues.startingMmr) * 
            equationValues.threesMultiplier + equationValues.startingMmr
        ;

        gameCountMultiplier += data.stats[mode].gamesPlayed * multiplier;
        newData.stats.global.mmr += data.stats[mode].gamesPlayed * multiplier * mmrMultiplier;

        const lineEnd = i < gameModes.length -2 ? '+' : ')';
        globalEqLog += `(${data.stats[mode].gamesPlayed} * ${multiplier} * ${mmrMultiplier})${lineEnd}`;
    }
    globalEqLog += ` / ${gameCountMultiplier}`;

    newData.stats.global.mmr = newData.stats.global.mmr / gameCountMultiplier;
    newData.stats.global.mmr = Math.round(newData.stats.global.mmr);
    

    if (generalData.logOptions.gameMmrResults) {
        cConsole.log([
            `[fg=green]${data.userData.name}[/>]`,
            `${newData.stats.global.mmr}`,
            `${newData.stats.global.gamesPlayed}\n${globalEqLog}\n`,
        ].join(' | '));
    }


    newData['__v'] = (data['__v'] + 1);

    await PlayerDataStorage.updateMany({_id: data['_id']}, newData);
}

async function getPlayerDataObject(userData) { // The user data that discord generates for a user
    const memberData = await generalUtilities.info.getMemberById(userData.id).catch(console.error);
    const forcedUserData = await userData.fetch(true);

    const newData = new PlayerDataStorage({
        _id: userData.id,
        userData: {
            name: userData.username,
            nickName: memberData.nickName,
            mention: `<@${userData.id}>`,
            discriminator: userData.discriminator,
            roles: memberData._roles,
            displayColor: forcedUserData.hexAccentColor ? forcedUserData.hexAccentColor : memberData.displayHexColor,
            avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=1024`,
            createdAt: new Date(userData.createdAt),
            joinedAt: new Date(memberData.joinedAt)
        }
    });
    return newData;
}

async function clearPlayerData(interaction, password) {
    const queueConfig = await queueSettings.getQueueDatabaseById(interaction.guild.id);
    const guildData = await guildSettings.findOne({_id: interaction.guild.id}).catch(console.error);
    console.log(guildData);
    if (password != clearPlayerDataPass) {
        const message = [
            `<@&${guildData.adminRole}>`,
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
        console.log(await PlayerDataStorage.deleteMany({}));

        queueConfig.gameId = 100;
        queueSettings.updateQueueDatabase(queueConfig);

        if (queueConfig.channelSettings.logChannel) {
            clientSendMessage.sendMessageTo(queueConfig.channelSettings.logChannel, [
                `<@&${guildData.adminRole}>`,
                `PlayerData has been cleard by <@${interaction.user.id}>`,
                `${interaction.user.id}`,
                `${interaction.user.username}#${interaction.user.discriminator}`
            ].join('\n'));
        }
        return true;
    }
}

module.exports = {
    getPlayerDataById,
    createPlayerData,
    updatePlayerData,
    clearPlayerData
}