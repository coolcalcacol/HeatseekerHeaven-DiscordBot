const GeneralUtilities = require('../utils/generalUtilities');
const cConsole = require('../utils/customConsoleLog');
const PlayerDataStorage = require('./database/playerDataStorage');
const GeneralData = require('./generalData');

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
        await createPlayerData(await GeneralUtilities.info.getUserById(id))
            .then((createdData) => {
                if (GeneralData.logOptions.playerData) console.log('Creating data');
                output = createdData;
            });
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
    const user = await GeneralUtilities.info.getUserById(data['_id']);
    const newData = await getPlayerDataObject(user);

    newData.stats.mmr = data.stats.mmr;
    newData.stats.gamesPlayed = data.stats.gamesPlayed;
    newData.stats.gamesWon = data.stats.gamesWon;
    newData.stats.gamesLost = data.stats.gamesLost;
    newData.stats.winRate = data.stats.winRate;

    await PlayerDataStorage.updateMany({_id: data['_id']}, newData);
}

async function getPlayerDataObject(userData) { // The user data that discord generates for a user
    // const memberData = await GeneralUtilities.info.getMemberById(userData.id).then(console.log)
    const newData = new PlayerDataStorage({
        _id: userData.id,
        userData: {
            name: userData.username,
            mention: `<@${userData.id}>`,
            discriminator: userData.discriminator,
            avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=1024`,
            createdAt: new Date(userData.createdAt)
        },
        stats: {
            mmr: 600,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            winRate: 0,
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