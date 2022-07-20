const generalUtilities = require('../utils/generalUtilities');
const cConsole = require('../utils/customConsoleLog');
const PlayerDataStorage = require('./database/playerDataStorage');

class PlayerData {
    constructor(data) {
        this.userData = data;
        this.user = {
            name: '',
            id: '',
            mention: '',
        }
        this.stats = {
            mmr: 600,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            winRate: 0,
        }
        this.formatData();
    }
    formatData() {
        this.user.id = this.userData.id;
        this.user.name = this.userData.username;
        this.user.mention = '<@' + this.user.id + '>';
    }
    calculateStats() {
        const w = this.stats.gamesWon;
        const l = this.stats.gamesLost;
        this.stats.gamesPlayed = w + l;
        this.stats.winRate = generalUtilities.generate.roundToFloat((w / (w + l) * 100), 2);
    }
    get playerData() {
        return this;
    }
}

async function getPlayerDataById(id, createIfNull = false) {
    var output;
    await PlayerDataStorage.findById(id)
        .then(async (result) => {
            if (result) {
                console.log('Found player data');
                console.log(result);
                output = result;
            }
        })
        .catch((err) => {console.log(err)});
    if (!output && createIfNull) {
        await createPlayerData(await generalUtilities.info.getUserById(id))
            .then((createdData) => {
                console.log('created data');
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
    const newData = new PlayerDataStorage({
        _id: userData.id,
        userData: userData,
        stats: {
            mmr: 600,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            winRate: 0,
        }
    })
    await PlayerDataStorage.insertMany(newData)
        .then((result) => {
            cConsole.log('New PlayerData created');
            console.log(result[0]);
            output = result[0];
        })
        .catch((err) => {console.log(err);});
    return output;
}

module.exports = {
    getPlayerDataById,
    createPlayerData
}