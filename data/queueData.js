const generalData = require('./generalData');
const QueueDatabase = require('./database/queueDataStorage');
// const { client } = require('./generalData');
const clientSendMessage = require('../utils/clientSendMessage');
const embedUtilities = require('../utils/embedUtilities');
const databaseUtilities = require('../utils/databaseUtilities');
const cConsole = require('../utils/customConsoleLog');
const generalUtilities = require('../utils/generalUtilities');

var globalQueueData = {
    lobby: {
        ones: {
            players: {},
            queueSize: 2
        },
        twos: {
            players: {},
            queueSize: 4
        },
        threes: {
            players: {},
            queueSize: 6
        },
    },
    gameId: 100,
    gamesInProgress: [],

    getGameID(readOnly = false) {
        if (!readOnly) { this.gameId++; }        
        return this.gameId;
    },
    clearLobbyQueue(lobby) {
        var props = Object.getOwnPropertyNames(this.lobby[lobby].players);
        for (var i = 0; i < props.length; i++) {
            delete this.lobby[lobby].players[props[i]];
        }
    }
}
class GameLobby {
    constructor(players, lobby) {
        this.lobby = lobby;
        this.players = [];
        for (const p in players) { this.players.push(p); }
        this.teams = {
            blue: [],
            orange: []
        }
        this.gameId = globalQueueData.getGameID();
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
// class GameLobby {
//     constructor(players, lobby) {
//         this.lobby = lobby;
//         this.players = [];
//         for (const p in players) { this.players.push(players[p]); }
//         this.teams = {
//             blue: {},
//             orange: {}
//         }
//         this.gameId = globalQueueData.getGameID();
//         this.getTeams();
//     }
//     getTeams() {
//         switch (this.lobby) {
//             case 'ones':{
//                 this.teams.blue = new TeamData([this.players[0]]);
//                 this.teams.orange = new TeamData([this.players[1]]);
//             } break;
//             case 'twos':{
//                 const generatedTeams = this.getBalancedTeams(2)
//                 this.teams.blue = new TeamData(generatedTeams[0]);
//                 this.teams.orange = new TeamData(generatedTeams[1]);
//             } break;
//             case 'threes':{
//                 const generatedTeams = this.getBalancedTeams(3)
//                 this.teams.blue = new TeamData(generatedTeams[0]);
//                 this.teams.orange = new TeamData(generatedTeams[1]);
//             } break;
        
//             default: break;
//         }
//         // console.log(this.teams);
//     }
//     getBalancedTeams(size) {
//         const array = this.players;
//         const combos = generalUtilities.generate.getAllCobinations(array, size);
//         var bestTeams = [combos[0], combos[1]]
//         var bestTotalScore = Math.pow(10, 8);
//         for (let x = 0; x < combos.length; x++) {
//             for (let y = 0; y < combos.length; y++) {
//                 var teamX = combos[x];
//                 var teamY = combos[y];
//                 var scoreX = 0;
//                 var scoreY = 0;
//                 var totalScore = 0;
//                 if (x == y) {continue;}
                
//                 var valid = true;
//                 for (let i = 0; i < teamX.length; i++) {
//                     for (let k = 0; k < teamY.length; k++) {
//                         if (teamX.includes(teamY[k])) {
//                             valid = false;
//                             break;
//                         }
//                     }
//                     if (!valid) {break;}
//                 }
//                 if (!valid) {continue;}
    
//                 for (let i = 0; i < teamX.length; i++) {
//                     scoreX += teamX[i].stats.mmr;
//                     scoreY += teamY[i].stats.mmr;
//                 }
//                 totalScore = Math.abs(scoreX - scoreY);
//                 if (totalScore < bestTotalScore) {
//                     // bestTeams.splice(0, 1, teamX);
//                     // bestTeams.splice(1, 1, teamY);
//                     bestTeams = [teamX, teamY];
//                     bestTotalScore = totalScore;
//                 }
//             }
//         }
//         return bestTeams;
//     }
//     get game() {
//         return this;
//     }
// }
// class TeamData {
//     constructor(team) {
//         this.members = team;
//         this.mmr = 0;
//         this.validate()
//     }
//     validate() {
//         for (const player in this.members) {
//             const data = this.members[player];
//             this.mmr += data.stats.mmr;
//         }
//     }
// }


async function addPlayerToQueue(interaction = null, lobby, userId = null) {
    if (!interaction && !userId) {console.log('No interaction param.'); return}
    for (const room in globalQueueData.lobby) {
        for (const player in globalQueueData.lobby[room].players) {
            const user = globalQueueData.lobby[room].players[player];
            if (userId != null) {continue;}
            if (interaction.user.id == user.id)  {
                return 'alreadyInQueue';
            }
        }
    }
    if (userId == null) {
        globalQueueData.lobby[lobby].players[interaction.user.id] = interaction.user;
    }
    else {
        const user = await generalUtilities.info.getUserById(userId);
        globalQueueData.lobby[lobby].players[user.id] = user;
    }

    if (Object.keys(globalQueueData.lobby[lobby].players).length == globalQueueData.lobby[lobby].queueSize) {
        // Start the queue
        console.log('Starting the queue for lobby: ' + lobby)
        await startQueue(lobby);
        return 'gameStarted';
    }
    else {
        return 'enteredQueue';
    }
}
async function fillQueueWithPlayers(players, lobby, amount) {
    const p = generalUtilities.generate.randomizeArray(players);
    for (let i = 0; i < amount; i++) {
        await addPlayerToQueue(null, lobby, p[i].toString());
    }
}
function removePlayerFromQueue(interaction, lobby) {
    for (const player in globalQueueData.lobby[lobby].players) {
        const user = globalQueueData.lobby[lobby].players[player];
        if (interaction.user.id == user.id) {
            delete globalQueueData.lobby[lobby].players[player];
            return 'removedFromQueue';
        }
    }
    return 'wasNotInQueue'
}

async function startQueue(lobby) {
    const game = new GameLobby(globalQueueData.lobby[lobby].players, lobby);
    const channelId = await databaseUtilities.get.getRankedLobbyByName(lobby).then(globalQueueData.clearLobbyQueue(lobby));

    globalQueueData.gamesInProgress.push(game);
    console.log(globalQueueData.gamesInProgress);

    var msgContent = '';
    for (const player in game.players) {
        const user = await generalUtilities.info.getUserById(game.players[player]);
        msgContent += '<@' + user.username + '> ';
    }
    clientSendMessage.sendMessageTo(channelId, {
        content: msgContent,
        embeds: embedUtilities.presets.queueGameStartPreset(game),
    });
}

function getCurrentQueue(lobby = 0) {
    if (lobby != 0) {
        return globalQueueData.lobby[lobby];
    }
    else {
        return globalQueueData;
    }
}

module.exports.actions = {
    addPlayerToQueue,
    fillQueueWithPlayers,
    removePlayerFromQueue
}
module.exports.info = {
    getCurrentQueue,
    globalQueueData
    // getCurrentQueueMessage
}