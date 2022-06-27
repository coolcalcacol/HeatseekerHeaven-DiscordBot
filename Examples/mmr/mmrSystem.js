const clientSendMessage = require('../../utils/clientSendMessage');
const cConsole = require('../../utils/customConsoleLog');
const generalUtilities = require('../../utils/generalUtilities');
const embedUtilities = require('../../utils/embedUtilities');
const queueData = require('../../data/queue').info.queueData;


const userWhitelist = [
    '479936093047750659',
    '280432147695665163',
    '599339755662082057',
    '688819598686289952',
    '614257446654967813',
    '287657356312051724',
    '399024946631802891',
    '465960027400830980',
    '267442458638417921',
    '371465297477238784',
    '437259152574906368',
    '138115007983517697',
    '295244765547462656',
    '492497679570436117',
    '95630080893521920',
    '568449733228756993',
]
const userList = []

class GameLobby {
    constructor(players, lobby) {
        this.lobby = lobby;
        this.players = [];
        for (const p in players) { this.players.push(players[p]); }
        this.teams = {
            blue: [],
            orange: []
        }
        this.gameId = queueData.getGameID();
        this.getTeams();
    }
    getTeams() {
        switch (this.lobby) {
            case 'ones':{
                this.teams.blue[0] = this.players[0];
                this.teams.orange[0] = this.players[1];
            } break;
            case 'twos':{
                this.teams.blue[0] = this.players[0];
                this.teams.blue[1] = this.players[1];
                this.teams.orange[0] = this.players[2];
                this.teams.orange[1] = this.players[3];
            } break;
            case 'threes':{
                this.teams.blue[0] = this.players[0];
                this.teams.blue[1] = this.players[1];
                this.teams.blue[2] = this.players[2];
                this.teams.orange[0] = this.players[3];
                this.teams.orange[1] = this.players[4];
                this.teams.orange[2] = this.players[5];
            } break;
        
            default: break;
        }
    }
    get game() {
        return this;
    }
}
class PlayerData {
    constructor(data) {
        this.data = data;
        this.user = {
            name: '',
            id: '',
            mention: '',
        }
        this.stats = {
            mmr: 600,
            gamesWon: 0,
            gamesLost: 0,
            winRate: 0,
        }
        this.formatData();
    }
    formatData() {
        this.user.id = this.data.id;
        this.user.name = this.data.username;
        this.user.mention = '<@' + this.user.id + '>';
    }
    calcWinRate() {
        const w = this.stats.gamesWon;
        const l = this.stats.gamesLost;
        this.stats.winRate = w / (w + l) * 100;
        // this.stats.winRate = Math.round(w / (w + l) * 100);
        // if (w > l) {
        //     this.stats.winRate = Math.round(l / w * 100);
        // }
        // else {
        //     this.stats.winRate = Math.round(w / l * 100);
        // }
    }
    get playerData() {
        return this;
    }
}

var playerDataList = [];
var gameInProgress;
var count = 0;
var interval = 100;
async function init() {
    if (userList.length == 0) {
        for (const id in userWhitelist) {
            userList.push(await generalUtilities.info.getUserById(userWhitelist[id]))
        }
    }

    // for (let i = 0; i < 1000; i++) {
    // }
    console.log(count)
    count++;
    if (count >= 10000) {return;}

    generateGame();
    reportGame();
    if (count == interval) {
        await clientSendMessage.editMessage(
            '990755902279798844',
            '990756029279129650', 
            {embeds: embedUtilities.presets.mmrStats(playerDataList)}
        )
        interval += 1000;
    }
    init();
    
    // console.log(playerDataList);

}
function generateGame() {
    const p = generalUtilities.generate.randomizeArray(userList);
    var queue = [];
    for (let i = 0; i < 6; i++) {
        const user = p[i];
        try {
            var playerData = getPlayerDataById(user.id);
        } catch(error) {
            // console.log(error)
            return
        }

        // cConsole.log([user.username, JSON.stringify(playerData)]);
        if (playerData == null) {
            const newData = new PlayerData(user)
            playerDataList.push(newData);
            playerData = newData;
        }
        queue.push(playerData);
    }
    gameInProgress = new GameLobby(queue, 'threes');
}
function reportGame() {
    const game = gameInProgress;
    const winIndex = generalUtilities.generate.getRandomInt(0, 1);
    var loseIndex;
    if (winIndex == 1) { loseIndex = 0; } else { loseIndex = 1; }
    const winningTeam = game.teams[Object.keys(game.teams)[winIndex]];
    const losingTeam = game.teams[Object.keys(game.teams)[loseIndex]];
    const x = winningTeam[0];
    calculatePlayerStats(winningTeam, losingTeam);
}
function calculatePlayerStats(winners, losers) {
    for (const player in winners) {
        var data = winners[player];
        // console.log('win: ' + data.user.name);
        data.stats.mmr += 10;
        data.stats.gamesWon++;
        data.calcWinRate();
    }
    for (const x in losers) {
        const data = losers[x];
        // console.log('lost: ' + data.user.name);
        data.stats.mmr -= 10;
        data.stats.gamesLost++;
        data.calcWinRate();
    }
}

function getPlayerDataById(id) {
    for (const data in playerDataList) {
        if (playerDataList[data].user.id == id) {
            return playerDataList[data];
        }
    }
    return null;
}

module.exports = {
    init
}