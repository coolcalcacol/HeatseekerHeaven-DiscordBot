const config = require('../config/config.json');
const GeneralData = require('./generalData');
const QueueDatabase = require('./database/queueConfigStorage');
// const { client } = require('./generalData');
const clientSendMessage = require('../utils/clientSendMessage');
const embedUtilities = require('../utils/embedUtilities');
const databaseUtilities = require('../utils/databaseUtilities');
const cConsole = require('../utils/customConsoleLog');
const generalUtilities = require('../utils/generalUtilities');
const PlayerData = require('./playerData');
const generalData = require('./generalData');
const queueSettings = require('./queueSettings');
const { logOptions } = require('./generalData');

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
    gameHistory: [],

    async getGameID(readOnly = false) {
        if (!readOnly) {
            this.gameId++;
            await QueueDatabase.updateOne({}, {gameId: this.gameId}).catch(console.error);
        }
        return this.gameId;
    },
    clearLobbyQueue(lobby) {
        var props = Object.getOwnPropertyNames(this.lobby[lobby].players);
        for (var i = 0; i < props.length; i++) {
            delete this.lobby[lobby].players[props[i]];
        }
    }
}
class GameLobbyData {
    constructor(players, lobby, bypass = false) {
        this.lobby = lobby;
        this.lobbyDisplay = '';
        this.players = {};
        for (const p in players) {
            this.players[p] = players[p];
        }
        this.teams = {
            blue: {},
            orange: {}
        }
        this.gameId;
        this.startTime = new Date();
        this.reportStatus;
        this.gameResults;
        this.bypassTeamGeneration = bypass;
        this.requestGameId();
        this.getTeams();
    }
    async requestGameId() {
        globalQueueData.gameId += 1;
        this.gameId = globalQueueData.gameId;
        await QueueDatabase.updateOne({}, {gameId: this.gameId}).catch(console.error);
    }
    getTeams() {
        switch (this.lobby) {
            case 'ones':{
                this.teams.blue = new TeamData([this.players[Object.keys(this.players)[0]]], this.lobby);
                this.teams.orange = new TeamData([this.players[Object.keys(this.players)[1]]], this.lobby);
            } break;
            case 'twos':{
                const generatedTeams = this.getBalancedTeams(2)
                this.teams.blue = new TeamData(generatedTeams[0], this.lobby);
                this.teams.orange = new TeamData(generatedTeams[1], this.lobby);
            } break;
            case 'threes':{
                if (!this.bypassTeamGeneration) {
                    const generatedTeams = this.getBalancedTeams(3)
                    this.teams.blue = new TeamData(generatedTeams[0], this.lobby);
                    this.teams.orange = new TeamData(generatedTeams[1], this.lobby);
                }
                else {
                    this.teams.blue = new TeamData([
                        this.players[Object.keys(this.players)[0]],
                        this.players[Object.keys(this.players)[1]],
                        this.players[Object.keys(this.players)[2]],
                    ], this.lobby);
                    this.teams.orange = new TeamData([
                        this.players[Object.keys(this.players)[3]],
                        this.players[Object.keys(this.players)[4]],
                        this.players[Object.keys(this.players)[5]],
                    ], this.lobby);
                }
            } break;

            default: break;
        }
        // console.log(this.teams);
    }
    getBalancedTeams(size) {
        if (generalData.logOptions.teamGeneration) {
            cConsole.log(`\n-------- [fg=blue]Initiated Team Generation[/>] --------`);
        }
        var array = [];
        for (const playerData in this.players) {
            array.push(this.players[playerData]);
        }
        const combos = generalUtilities.generate.getAllCobinations(array, size);
        var bestTeams = [combos[0], combos[1]]
        var bestTotalScore = Math.pow(10, 8);
        for (let x = 0; x < combos.length; x++) {
            for (let y = 0; y < combos.length; y++) {
                var teamX = combos[x];
                var teamY = combos[y];
                var scoreX = 0;
                var scoreY = 0;
                var totalScore = 0;
                if (x == y) {continue;}

                var valid = true;
                for (let i = 0; i < teamX.length; i++) {
                    for (let k = 0; k < teamY.length; k++) {
                        if (teamX.includes(teamY[k])) {
                            valid = false;
                            break;
                        }
                    }
                    if (!valid) {break;}
                }
                if (!valid) {continue;}

                for (let i = 0; i < teamX.length; i++) {
                    scoreX += teamX[i].stats[this.lobby].mmr;
                    scoreY += teamY[i].stats[this.lobby].mmr;
                }
                totalScore = Math.abs(scoreX - scoreY);
                if (totalScore < bestTotalScore) {
                    // console.log('-------- [fg=blue]New Best Team[/>] --------');
                    // console.log(this.getTeamMembersLog(teamX, teamY) + '\n');
                    bestTeams = [teamX, teamY];
                    bestTotalScore = totalScore;
                }
            }
        }
        if (generalData.logOptions.teamGeneration) {
            cConsole.log(`-------- [fg=blue]Team Generation Result[/>] --------`);
            cConsole.log(
                `[style=bold][fg=green]${this.getTeamMembersLog(bestTeams[0], bestTeams[1])}[/>]`,
                {autoColorize: false}
            );

            if (generalData.logOptions.gameData) {
                cConsole.log(`-------- [fg=blue]Generated Team Data[/>] --------`);
                console.log(bestTeams);
            }
        }
        return bestTeams;
    }
    getTeamMembersLog(teamX, teamY) {
        var output = '';
        for (let i = 0; i < 2; i++) {
            const team = i == 0 ? teamX : teamY;
            for (const data in team) {
                output += team[data].userData.name + ' ';
            }
            output += '\n';
        }
        return output;
    }
    get game() {
        return this;
    }
}
class TeamData {
    constructor(team, mode) {
        this.members = {}; // Recently Changed to be stored as an object and not an array
        for (let i = 0; i < team.length; i++) { this.members[team[i]['_id']] = team[i]; }
        this.mode = mode;
        this.mmr = 0;
        this.validate()
    }
    validate() {
        for (const player in this.members) {
            const data = this.members[player];
            this.mmr += data.stats[this.mode].mmr;
        }
    }
}


async function addPlayerToQueue(interaction = null, lobby, userId = null, queueSettingsData) {
    var playerData;
    if (!interaction && !userId) {console.log('No interaction param.'); return}
    if (userId == null) { userId = interaction.user.id; }

    const playerReservedStatus = userReservedStatus(userId);
    if (playerReservedStatus != false) return playerReservedStatus;


    await PlayerData.getPlayerDataById(userId, true, queueSettingsData)
        .then(async (foundData) => {
            if (GeneralData.logOptions.getPlayerData) {
                console.log('Received PlayerData [addPlayerToQueue]');
                console.log(foundData);
            }
            playerData = foundData;
        })
        .catch(console.error);
    globalQueueData.lobby[lobby].players[userId] = playerData;

    if (Object.keys(globalQueueData.lobby[lobby].players).length == globalQueueData.lobby[lobby].queueSize) {
        // Start the queue
        if (GeneralData.logOptions.gameData) { console.log('Starting the queue for lobby: ' + lobby); }
        await startQueue(lobby, interaction ? interaction.guild.id : config.botSetupGuildId);
        return 'gameStarted';
    }
    else {
        return 'enteredQueue';
    }
}
async function fillQueueWithPlayers(players, lobby, amount, queueSettingsData) {
    const p = generalUtilities.generate.randomizeArray(players);
    for (let i = 0; i < amount; i++) {
        await addPlayerToQueue(null, lobby, p[i].toString(), queueSettingsData);
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

async function startQueue(lobby, guildId, gameData = null) {
    const game = gameData ? gameData : new GameLobbyData(globalQueueData.lobby[lobby].players, lobby);
    const channelId = await queueSettings.getRankedLobbyByName(lobby, guildId)
        .then(globalQueueData.clearLobbyQueue(lobby));

    globalQueueData.gamesInProgress.push(game);
    if (GeneralData.logOptions.gameData) console.log(globalQueueData.gamesInProgress);

    var msgContent = '';
    for (const player in game.players) {
        const user = game.players[player];
        if (GeneralData.debugMode) {
            msgContent += '`' + user.userData.mention + '` ';
        }
        else {
            msgContent += user.userData.mention + ' ';
        }
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

function userReservedStatus(userId, returnGameData = false) {
    for (const room in globalQueueData.lobby) {
        for (const player in globalQueueData.lobby[room].players) {
            if (userId == player)  return 'inQueue';
        }
    }
    for (let i = 0; i < globalQueueData.gamesInProgress.length; i++) {
        const game = globalQueueData.gamesInProgress[i];
        for (const player in game.players) {
            if (player == userId) {
                if (returnGameData) return game;
                else return 'inOngoingGame';
            }
        }
    }
    return false;
}

module.exports.actions = {
    addPlayerToQueue,
    fillQueueWithPlayers,
    removePlayerFromQueue,
    startQueue
}
module.exports.info = {
    getCurrentQueue,
    userReservedStatus,
    globalQueueData,
    GameLobbyData
    // getCurrentQueueMessage
}