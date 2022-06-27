const generalData = require('./generalData');
const QueueDatabase = require('./database/queueDataStorage');
const { client } = require('./generalData');
const clientSendMessage = require('../utils/clientSendMessage');
const embedUtilities = require('../utils/embedUtilities');
const databaseUtilities = require('../utils/databaseUtilities');
const cConsole = require('../utils/customConsoleLog');
const generalUtilities = require('../utils/generalUtilities');

var queueData = {
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

async function addPlayerToQueue(interaction = null, lobby, userId = null) {
    if (!interaction && !userId) {console.log('No interaction param.'); return}
    for (const room in queueData.lobby) {
        for (const player in queueData.lobby[room].players) {
            const user = queueData.lobby[room].players[player];
            if (userId != null) {continue;}
            if (interaction.user.id == user.id)  {
                return 'alreadyInQueue';
            }
        }
    }
    if (userId == null) {
        queueData.lobby[lobby].players[interaction.user.id] = interaction.user;
    }
    else {
        const user = await generalUtilities.info.getUserById(userId);
        queueData.lobby[lobby].players[user.id] = user;
    }

    if (Object.keys(queueData.lobby[lobby].players).length == queueData.lobby[lobby].queueSize) {
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
    for (const player in queueData.lobby[lobby].players) {
        const user = queueData.lobby[lobby].players[player];
        if (interaction.user.id == user.id) {
            delete queueData.lobby[lobby].players[player];
            return 'removedFromQueue';
        }
    }
    return 'wasNotInQueue'
}

async function startQueue(lobby) {
    const game = new GameLobby(queueData.lobby[lobby].players, lobby);
    const channelId = await databaseUtilities.get.getRankedLobbyByName(lobby).then(queueData.clearLobbyQueue(lobby));

    queueData.gamesInProgress.push(game);
    console.log(queueData.gamesInProgress);

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
        return queueData.lobby[lobby];
    }
    else {
        return queueData;
    }
}

module.exports.actions = {
    addPlayerToQueue,
    fillQueueWithPlayers,
    removePlayerFromQueue
}
module.exports.info = {
    getCurrentQueue,
    queueData
    // getCurrentQueueMessage
}