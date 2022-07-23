const GeneralData = require('./generalData');
const PlayerDataStorage = require('./database/playerDataStorage');
const generalUtilities = require('../utils/generalUtilities');
const cConsole = require('../utils/customConsoleLog');

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
    
    for (const lobby in newData.stats) {
        const mode = newData.stats[lobby];
        // console.log(mode);
        // console.log(lobby);

        newData.stats[lobby].mmr = data.stats[lobby].mmr;
        newData.stats[lobby].gamesPlayed = data.stats[lobby].gamesPlayed;
        newData.stats[lobby].gamesWon = data.stats[lobby].gamesWon;
        newData.stats[lobby].gamesLost = data.stats[lobby].gamesLost;
        newData.stats[lobby].winRate = data.stats[lobby].winRate;
    }

    for (const mode in data.stats) {
        // const multiplier = mode == 'twos' ? 0.75 : mode == 'threes' ? 1 : 0.5;
        newData.stats.global.mmr = data.stats[mode].mmr * data.stats[mode].gamesPlayed;
    }
    newData.stats.global.mmr = newData.stats.global.mmr / data.stats.global.gamesPlayed;
    newData.stats.global.mmr = Math.round(newData.stats.global.mmr)


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