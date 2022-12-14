const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

//#region Data
    const QueueConfigStorage = require('./database/queueConfigStorage');
    const QueueDatabase = require('./database/queueDataStorage');
    const PlayerData = require('./playerData');
    const PlayerDatabase = require('./database/playerDataStorage');
    const generalData = require('./generalData');
    const queueSettings = require('./queueSettings');
    const queueGameChannels = require('./queueGameChannels');
//#endregion

//#region Utillities
    const clientSendMessage = require('../utils/clientSendMessage');
    const embedUtilities = require('../utils/embedUtilities');
    const cConsole = require('../utils/customConsoleLog');
    const generalUtilities = require('../utils/generalUtilities');
//#endregion

const queueAdmin = require('../commands/queueAdmin');
const botUpdate = require('../events/botUpdate');

const config = require('../config/config.json');
const getQueueConfig = async (guildId = generalData.botConfig.defaultGuildId) => { 
    return await QueueConfigStorage.findOne({_id: guildId}).catch(console.error);
}

const globalQueueData = {
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
    
    /** 
     * @param {string} gameId
     * @returns {GameLobbyData}
    */
    getActiveGame(gameId) {
        for (let i = 0; i < this.gamesInProgress.length; i++) {
            const game = this.gamesInProgress[i];
            if (gameId == game.gameId) {
                return game;
            }
        }
    },
    async getGameID(readOnly = false) {
        if (!readOnly) {
            this.gameId++;
            await QueueConfigStorage.updateOne({}, {gameId: this.gameId}).catch(console.error);
        }
        return this.gameId;
    },
    clearLobbyQueue(lobby) {
        var props = Object.getOwnPropertyNames(this.lobby[lobby].players);
        for (var i = 0; i < props.length; i++) {
            delete this.lobby[lobby].players[props[i]];
        }
    },
}
//#region Classes
    class GameLobbyData {
        constructor(players, lobby, bypass = false) {
            this.gameStatusEnum = Object.freeze({
                INITIATED: 0, 
                TEAM_SELECTION: 1, 
                IN_PROGRESS: 3, 
                FINISHED: 4, 
                CANCELLED: 5
            });

            this.gameId;
            this.status = this.gameStatusEnum.INITIATED;
            this.lobby = lobby;
            this.lobbyChannelId = '';
            this.lobbyDisplay = '';
            this.teamSelection = 'random';
            this.teamSelectionVotes = {balanced: {count: 0, users: []}, random: {count: 0, users: []}}
            this.teamSelectionVoteTime = new Date().getTime(); // Starts in onChannelsCreated()
            this.region = 'EU';
            this.players = {};
            this.teams = {blue: {}, orange: {}}
            this.channels = {gameChat: null, blue: null, orange: null, category: null}
            this.channelPermissions = {default: [], gameChat: [], blue: [], orange: []}

            this.teamSelectMessage = {};
            this.queueStartMessage = {};
            this.teamSelectMessageContent = {content: 'ERROR: No team selection message content for ' + this.gameId};
            this.queueStartMessageContent = {content: 'ERROR: No message content for ' + this.gameId};

            this.startTime = new Date();
            this.gameDuration = 0; // in milliseconds

            this.reportStatus;
            this.gameResults;
            // this.bypassTeamGeneration = bypass;

            for (const p in players) { this.players[p] = players[p]; }

            this.requestGameId();
            // this.getTeamSelectionMessageContent(true);
            // this.getTeams(this.teamSelection);
            // this.sendGameStartMessage();
        }
        async requestGameId() {
            globalQueueData.gameId += 1;
            this.gameId = globalQueueData.gameId;
            await QueueConfigStorage.updateOne({}, {gameId: this.gameId}).catch(console.error);
        }

        onGameChatCreated() {
            this.status = this.gameStatusEnum.TEAM_SELECTION;

            if (this.lobby == 'ones') { 
                this.teamSelection = 'random';
                this.startGame();
                return;
            }

            this.teamSelectionVoteTime = new Date(new Date().setSeconds(new Date().getSeconds() + 30)).getTime()
            this.getTeamSelectionMessageContent(true);
            new botUpdate.UpdateTimer(`${this.gameId}-teamSelection`, this.teamSelectionVoteTime, this.startGame.bind(this));
        }
        async startGame() {
            if (this.status >= 3) { return; } // Game already started
            this.status = this.gameStatusEnum.IN_PROGRESS;
            this.getGameRegion();
            this.getTeams();
            await queueGameChannels.createVoiceChannels(this);
            this.startTime = new Date();
            this.sendGameStartMessage();

            cConsole.log(`\n-------- [fg=green]Game[/>] ${this.gameId} [fg=green]started[/>] --------`);
            cConsole.log({
                gameId: this.gameId,
                lobby: this.lobby,
                region: this.region,
                teamSelection: this.teamSelection,
            });
            cConsole.log(' ');
        }

        async getTeamSelectionMessageContent(send = false) {
            if (this.status >= 3) { return; } // Game already started
            const buttons = {
                balanced: new MessageButton({
                    customId: `team-selection_balanced_${this.gameId}`,
                    label: 'Balanced', 
                    style: 'PRIMARY', 
                    disabled: false,
                }),
                random: new MessageButton({
                    customId: `team-selection_random_${this.gameId}`,
                    label: 'Random', 
                    style: 'PRIMARY', 
                    disabled: false,
                })
            }
            const buttonRow = new MessageActionRow().addComponents(buttons.balanced, buttons.random);

            const embed = new MessageEmbed({
                title: 'Team Selection',
                description: 'Vote for a team selection method\n' + `Time to vote: <t:${generalUtilities.generate.getTimestamp(this.teamSelectionVoteTime)}:R>`,
                fields: [
                    {name: 'Balanced', value: `\`${embedUtilities.methods.getFieldSpacing(this.teamSelectionVotes.balanced.count, 5, true)}\``, inline: true},
                    {name: 'Random', value: `\`${embedUtilities.methods.getFieldSpacing(this.teamSelectionVotes.random.count, 5, true)}\``, inline: true},
                ],
                color: 'BLUE',
            });

            if (!send) return {content: msgContent, embeds: [embed], components: [buttonRow]};
            else {
                if (Object.keys(this.teamSelectMessage).length > 0) {
                    this.teamSelectMessage = await clientSendMessage.editMessage(
                        this.teamSelectMessage.channelId,
                        this.teamSelectMessage.id,
                        {
                            content: this.getPlayersString(!generalData.debugMode),
                            embeds: [embed],
                            components: [buttonRow]
                        }
                    );
                }
                else {
                    this.teamSelectMessage = await clientSendMessage.sendMessageTo(
                        this.channels.gameChat.id,
                        {
                            content: this.getPlayersString(!generalData.debugMode),
                            embeds: [embed],
                            components: [buttonRow]
                        }
                    );
                }
            }
        }
        async sendGameStartMessage() {
            const queueStartMessage = {
                content: this.getPlayersString(!generalData.debugMode),
                embeds: embedUtilities.presets.queueGameStartPreset(this)
            }
            this.queueStartMessageContent = queueStartMessage;

            if (Object.keys(this.teamSelectMessage).length > 0) {
                this.queueStartMessage = await clientSendMessage.editMessage(
                    this.teamSelectMessage.channelId, 
                    this.teamSelectMessage.id, 
                    {
                        content: queueStartMessage.content,
                        embeds: queueStartMessage.embeds,
                        components: []
                    }
                );
            }
            else {
                this.queueStartMessage = await clientSendMessage.sendMessageTo(
                    this.channels.gameChat.id,
                    {
                        content: queueStartMessage.content,
                        embeds: queueStartMessage.embeds,
                        components: []
                    }
                );
            }
            // await this.channels.gameChat.send({content: queueStartMessage.content, embeds: [queueStartMessage.embeds]});
        }

        getTeams(teamSelection = this.teamSelection) { // teamSelection = 'balanced' || 'random'
            switch (this.lobby) {
                case 'ones':{
                    this.teams.blue = new TeamData([this.players[Object.keys(this.players)[0]]], this.lobby);
                    this.teams.orange = new TeamData([this.players[Object.keys(this.players)[1]]], this.lobby);
                } break;
                case 'twos':{
                    const generatedTeams = (teamSelection == 'balanced') ? this.getBalancedTeams(2) : this.getRandomTeams(2);
                    this.teams.blue = new TeamData(generatedTeams[0], this.lobby);
                    this.teams.orange = new TeamData(generatedTeams[1], this.lobby);
                } break;
                case 'threes':{
                    const generatedTeams = (teamSelection == 'balanced') ? this.getBalancedTeams(3) : this.getRandomTeams(3);
                    this.teams.blue = new TeamData(generatedTeams[0], this.lobby);
                    this.teams.orange = new TeamData(generatedTeams[1], this.lobby);
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
        getRandomTeams(size) {
            let array = [];
            for (const playerData in this.players) {
                array.push(this.players[playerData]);
                array = generalUtilities.generate.randomizeArray(array);
            }
            switch(size) {
                case 2: { return [[array[0], array[1]], [array[2], array[3]]] };
                case 3: { return [[array[0], array[1], array[2]], [array[3], array[4], array[5]]]; };
                default: break;
            }
            return array;
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
        getPlayersString(mention = false) {
            var output = '';
            for (const player in this.players) {
                if (mention) {
                    output += `<@${player}> `;
                }
                else {
                    output += this.players[player].userData.name + ' ';
                }
            }
            return output;
        }
        async getGameRegion() {
            const queueConfig = await getQueueConfig();
            const euRole = (queueConfig.roleSettings.regionEU.id) ? queueConfig.roleSettings.regionEU : null;
            const usRole = (queueConfig.roleSettings.regionUS.id) ? queueConfig.roleSettings.regionUS : null;

            var euPlayers = 0;
            var usPlayers = 0;
            for (const player in this.players) {
                const memberData = await generalUtilities.info.getMemberById(player);
                if (!euRole || !usRole) continue;
                if (memberData._roles.includes(euRole.id)) { euPlayers++; }
                if (memberData._roles.includes(usRole.id)) { usPlayers++; }
            }
            // console.log('eu: ' + euPlayers + ' | us: ' + usPlayers);
            if (usPlayers > euPlayers) {
                this.region = 'US-East';
            }
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
//#endregion

//#region Base Actions
    async function addPlayerToQueue(interaction = null, lobby, userId = null, queueSettingsData) {
        var playerData;
        if (!interaction && !userId) {console.log('No interaction param.'); return}
        if (userId == null) { userId = interaction.user.id; }

        const playerReservedStatus = await userReservedStatus(userId);
        if (playerReservedStatus != false) return playerReservedStatus;


        await PlayerData.getPlayerDataById(userId, true, queueSettingsData)
            .then(async (foundData) => {
                if (generalData.logOptions.getPlayerData) {
                    console.log('Received PlayerData [addPlayerToQueue]');
                    console.log(foundData);
                }
                if (!foundData.userData.isMember) {
                    foundData.userData.isMember = true;
                    await PlayerDatabase.updateOne({_id: userId}, foundData).catch(console.error);
                    cConsole.log(`[fg=green][style=bold]${foundData.userData.name}[/>] [fg=blue]has come back to the server. [fg=green]Enabling[/>][fg=blue] their playerData again[/>]`, {autoColorize: false});
                }
                playerData = foundData;
            })
            .catch(console.error);
        globalQueueData.lobby[lobby].players[userId] = playerData;
        

        if (Object.keys(globalQueueData.lobby[lobby].players).length == globalQueueData.lobby[lobby].queueSize) {
            // Start the queue
            if (generalData.logOptions.gameData) { console.log('Starting the queue for lobby: ' + lobby); }
            const newGame = await startQueue(lobby, interaction ? interaction.guild.id : generalData.botConfig.defaultGuildId);
            return 'gameStarted:' + newGame.gameId;
        }
        else {
            const time = new Date();
            // new botUpdate.UpdateTimer('queueTimeout-' + userId, time.setSeconds(time.getSeconds() + 5), queueInactivityTimeout.bind(this, userId))
            new botUpdate.UpdateTimer('queueTimeout-' + userId, time.setMinutes(time.getMinutes() + 20), queueInactivityTimeout.bind(this, userId))
            return 'enteredQueue';
        }
    }
    function removePlayerFromQueue(interaction, lobby) {
        const userId = interaction.user ? interaction.user.id : interaction.id;
        for (const player in globalQueueData.lobby[lobby].players) {
            const user = globalQueueData.lobby[lobby].players[player];
            if (userId == user.id) {
                delete globalQueueData.lobby[lobby].players[player];
                return 'removedFromQueue';
            }
        }
        return 'wasNotInQueue';
    }

    /** 
     * @param {GameLobbyData} gameData
    */
    async function startQueue(lobby, guildId, gameData = null) {
        const game = gameData ? gameData : new GameLobbyData(globalQueueData.lobby[lobby].players, lobby);
        game.lobbyChannelId = await queueSettings.getRankedLobbyByName(lobby, guildId).then(globalQueueData.clearLobbyQueue(lobby));
        
        globalQueueData.gamesInProgress.push(game);
        if (generalData.logOptions.gameData) console.log(globalQueueData.gamesInProgress);

        if (await queueSettings.getQueueDatabaseById(generalData.botConfig.defaultGuildId).then((data) => {
            return data.channelSettings.teamChannelCategory;
        })) { 
            queueGameChannels.createGameChannels(game); 
        }
        else { clientSendMessage.sendMessageTo(game.lobbyChannelId, game.queueStartMessage); }
        return game;
    }
//#endregion

//#region Queue Modiration
    async function queueInactivityTimeout(userId) {
        if (await userReservedStatus(userId) != 'inQueue') return;
        console.log('Time out id: ' + userId + ' | ' + await userReservedStatus(userId));
        queueAdmin.overwriteOptions.command = 'remove-user';
        queueAdmin.overwriteOptions.removeUser.user = userId;
        queueAdmin.overwriteOptions.removeUser.initiator.user.username = 'HHBot';
        queueAdmin.overwriteOptions.removeUser.initiator.user.displayAvatarURL = generalData.client.user.displayAvatarURL();
        queueAdmin.execute(null, true)
    }

    async function fillQueueWithPlayers(players, lobby, amount, queueSettingsData) {
        const p = generalUtilities.generate.randomizeArray(players);
        for (let i = 0; i < amount; i++) {
            await addPlayerToQueue(null, lobby, p[i].toString(), queueSettingsData);
        }
    }
//#endregion

//#region Getters
    async function userReservedStatus(userId, returnGameData = false) {
        const guildQueueData = await QueueDatabase.findOne({_id: generalData.botConfig.defaultGuildId});
        const blacklist = guildQueueData.userBlacklist;

        for (const user in blacklist) {
            if (user == 'placeholder') continue;
            if (userId == user) {
                return 'userIsBlacklisted';
            }
        }
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

    /**
     * @param {String} lobby the lobby name [ones, twos, threes]
     * @returns {String} The lobby as a readable string like 1v1
     */
    function getLobbyString(lobby) {
        switch(lobby) {
            case 'ones': { return '1v1'; } break;
            case 'twos': { return '2v2'; } break;
            case 'threes': { return '3v3'; } break;
            default: break;
        }
        return '0v0';
    }

    function getCurrentQueue(lobby = 0) {
        if (lobby != 0) {
            return globalQueueData.lobby[lobby];
        }
        else {
            return globalQueueData;
        }
    }

    /** 
     * @param {String} gameId
     * @returns {GameLobbyData} The game data
    */
    function getGameDataById(gameId) {
        for (let i = 0; i < globalQueueData.gamesInProgress.length; i++) {
            const game = globalQueueData.gamesInProgress[i];
            if (game.gameId == gameId) {
                return game;
            }
        }
        for (let i = 0; i < globalQueueData.gameHistory.length; i++) {
            const game = globalQueueData.gameHistory[i];
            if (game.gameId == gameId) {
                return game;
            }
        }
        return null;
    }
//#endregion



module.exports.actions = {
    addPlayerToQueue,
    fillQueueWithPlayers,
    removePlayerFromQueue,
    startQueue
}
module.exports.info = {
    getCurrentQueue,
    userReservedStatus,
    getLobbyString,
    getGameDataById,
    globalQueueData,
    GameLobbyData
    // getCurrentQueueMessage
}