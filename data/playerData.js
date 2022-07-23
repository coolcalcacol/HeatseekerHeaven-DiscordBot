const GeneralData = require('./generalData');
const PlayerDataStorage = require('./database/playerDataStorage');
const generalUtilities = require('../utils/generalUtilities');
const cConsole = require('../utils/customConsoleLog');
const generalData = require('./generalData');

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

async function updatePlayerData(data) {
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
    var gameCountMultiplier = 0;
    for (let i = 0; i < gameModes.length; i++) {
        const mode = gameModes[i];
        if (mode == 'global') continue;
        
        const multiplier = mode == 'twos' ? 0.75 : mode == 'threes' ? 1 : 0.5;
        var mmrMultiplier = data.stats.threes.mmr;
        if (mode == 'ones') {
            mmrMultiplier = (data.stats.ones.mmr - 600) * 0.528 + 600;
        }
        if (mode == 'twos') {
            mmrMultiplier = (data.stats.twos.mmr - 600) * 0.848 + 600;
        }

        gameCountMultiplier += data.stats[mode].gamesPlayed * multiplier;
        newData.stats.global.mmr += data.stats[mode].gamesPlayed * multiplier * mmrMultiplier;
    }

    newData.stats.global.mmr = newData.stats.global.mmr / gameCountMultiplier;
    newData.stats.global.mmr = Math.round(newData.stats.global.mmr);

    if (generalData.logOptions.gameMmrResults) {
        console.log(
            'G ' + 
            data.userData.name + ' + ' + 
            newData.stats.global.mmr + ' | ' + 
            newData.stats.global.gamesPlayed
        );
    }


    newData['__v'] = (data['__v'] + 1);

    await PlayerDataStorage.updateMany({_id: data['_id']}, newData);
}

async function getPlayerDataObject(userData) { // The user data that discord generates for a user
    const memberData = await generalUtilities.info.getMemberById(userData.id).catch(console.error);
    const newData = new PlayerDataStorage({
        _id: userData.id,
        userData: {
            name: userData.username,
            nickName: memberData.nickName,
            mention: `<@${userData.id}>`,
            discriminator: userData.discriminator,
            roles: memberData._roles,
            displayColor: memberData.displayHexColor,
            avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=1024`,
            createdAt: new Date(userData.createdAt),
            joinedAt: new Date(memberData.joinedAt)
        },
        stats: {
            global: {
                mmr: 600,
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                winRate: 0,
            },
            ones: {
                mmr: 600,
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                winRate: 0,
            },
            twos: {
                mmr: 600,
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                winRate: 0,
            },
            threes: {
                mmr: 600,
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                winRate: 0,
            },
        }
    });
    return newData;
}

async function clearPlayerData() {
    console.log('Deleting PlayerData...');
    console.log(await PlayerDataStorage.deleteMany({}));
}

module.exports = {
    getPlayerDataById,
    createPlayerData,
    updatePlayerData,
    clearPlayerData
}