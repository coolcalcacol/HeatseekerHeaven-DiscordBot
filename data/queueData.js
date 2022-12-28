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
            this.lobbyChannel = {};
            this.lobbyChannelId = '';
            this.lobbyDisplay = '';
            this.teamSelection = 'balanced';
            
            this.players = {};
            this.teams = {blue: {}, orange: {}}
            this.channels = {gameChat: null, blue: null, orange: null, category: null}
            this.channelPermissions = {default: [], gameChat: [], blue: [], orange: []}
            this.region = {region: 'EU', regionDisplay: 'EU', role: null, neighbours: [], tieBreaker: true};
            
            this.messages = {
                teamSelect: {
                    message: {},
                    content: {content: 'ERROR: No team selection message content for ' + this.gameId}
                },
                captainSelect: {
                    message: {},
                    content: {content: 'ERROR: No captain selection message content for ' + this.gameId}
                },
                queueStart: {
                    message: {},
                    content: {content: 'ERROR: No message content for ' + this.gameId}
                },
            }
            this.teamSelectionVotes = {balanced: {count: 0, users: []}, random: {count: 0, users: []}, captains: {count: 0, users: []}}
            this.teamSelectionTotalVoteTime = 30; // in secconds
            this.captainSelectionTotalTime = 60; // in secconds
            this.teamSelectionVoteTime = new Date().getTime(); // Starts in onChannelsCreated()
            this.captainSelectionTime = new Date().getTime(); // Starts in onChannelsCreated()

            this.startTime = new Date(); // is set again in startGame()
            this.gameDuration = 0; // in milliseconds

            this.queueConfig = null;

            this.reportStatus;
            this.gameResults;

            this.tmpStorage;

            for (const p in players) { this.players[p] = players[p]; }

            this.validateGameData();
            this.requestGameId();
        }

        async validateGameData() {
            this.queueConfig = await getQueueConfig();
        }
        async requestGameId() {
            globalQueueData.gameId += 1;
            this.gameId = globalQueueData.gameId;
            await QueueConfigStorage.updateOne({}, {gameId: this.gameId}).catch(console.error);
        }

        async onGameChatCreated() {
            this.status = this.gameStatusEnum.TEAM_SELECTION;
            this.teamSelectionVoteTime = new Date(new Date().setSeconds(new Date().getSeconds() + this.teamSelectionTotalVoteTime)).getTime();
            

            if (this.lobby == 'ones') { 
                this.teamSelection = 'random';
                this.startGame();
                return;
            }
            // else if (generalData.debugMode) {
            //     // this.teamSelection = (generalUtilities.generate.getRandomInt(0, 1) == 0) ? 'balanced' : 'random';
            //     this.teamSelection = 'captains';
            //     this.tmpStorage = this.channels.gameChat;
            //     // this.channels.gameChat = this.lobbyChannel;
            //     this.startGame();
            //     return;
            // }

            this.getTeamSelectionMessageContent(true);
            new botUpdate.UpdateTimer(`${this.gameId}-teamSelection`, this.teamSelectionVoteTime, this.startGame.bind(this));
        }
        async startGame() {
            if (this.status >= 3) { return; } // Game already started
            this.status = this.gameStatusEnum.IN_PROGRESS;
            await this.getTeams();
            await this.getGameRegion();
            // this.channels.gameChat = this.tmpStorage;
            await queueGameChannels.createVoiceChannels(this);
            this.startTime = new Date();
            this.sendGameStartMessage();

            cConsole.log(`\n-------- [fg=green]Game[/>] ${this.gameId} [fg=green]started[/>] --------`);
            cConsole.log({
                gameId: this.gameId,
                lobby: this.lobby,
                region: this.region.regionDisplay,
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
                }),
                captains: new MessageButton({
                    customId: `team-selection_captains_${this.gameId}`,
                    label: 'Captains', 
                    style: 'PRIMARY', 
                    disabled: false,
                })
            }
            const buttonRow = new MessageActionRow().addComponents(buttons.balanced, buttons.random, buttons.captains);

            const embed = new MessageEmbed({
                title: 'Team Selection',
                description: 'Vote for a team selection method\n' + `Time to vote: <t:${generalUtilities.generate.getTimestamp(this.teamSelectionVoteTime)}:R>`,
                fields: [
                    {name: 'Balanced', value: `\`${embedUtilities.methods.getFieldSpacing(this.teamSelectionVotes.balanced.count, 5, true)}\``, inline: true},
                    {name: 'Random', value: `\`${embedUtilities.methods.getFieldSpacing(this.teamSelectionVotes.random.count, 5, true)}\``, inline: true},
                    {name: 'Captains', value: `\`${embedUtilities.methods.getFieldSpacing(this.teamSelectionVotes.captains.count, 5, true)}\``, inline: true},
                ],
                color: 'BLUE',
            });

            if (!send) return {content: msgContent, embeds: [embed], components: [buttonRow]};
            else {
                if (Object.keys(this.messages.teamSelect.message).length > 0) {
                    this.messages.teamSelect.message = await clientSendMessage.editMessage(
                        this.messages.teamSelect.message.channelId,
                        this.messages.teamSelect.message.id,
                        {
                            content: this.getPlayersString(!generalData.debugMode),
                            embeds: [embed],
                            components: [buttonRow]
                        }
                    );
                }
                else {
                    this.messages.teamSelect.message = await clientSendMessage.sendMessageTo(
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
            this.messages.queueStart.content = queueStartMessage;

            const message = {
                content: queueStartMessage.content,
                embeds: queueStartMessage.embeds,
                components: []
            }
            if (Object.keys(this.messages.teamSelect.message).length > 0) {
                this.messages.queueStart.message = await clientSendMessage.editMessage(
                    this.messages.teamSelect.message.channelId, 
                    this.messages.teamSelect.message.id, 
                    message
                );
            }
            // else if (Object.keys(this.messages.captainSelect.message).length > 0) {
            //     this.messages.queueStart.message = await clientSendMessage.editMessage(
            //         this.messages.captainSelect.message.channelId, 
            //         this.messages.captainSelect.message.id, 
            //         message
            //     );
            // }
            else {
                this.messages.queueStart.message = await clientSendMessage.sendMessageTo(
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

        async getTeams(teamSelection = this.teamSelection) { // teamSelection = 'balanced' || 'random' || 'captains'
            switch (this.lobby) {
                case 'ones': {
                    this.teams.blue = new TeamData([this.players[Object.keys(this.players)[0]]], this.lobby);
                    this.teams.orange = new TeamData([this.players[Object.keys(this.players)[1]]], this.lobby);
                } break;
                case 'twos': {
                    const generatedTeams = 
                        (teamSelection == 'balanced') ? 
                            this.getBalancedTeams(2) : this.getRandomTeams(2);

                    this.teams.blue = new TeamData(generatedTeams[0], this.lobby);
                    this.teams.orange = new TeamData(generatedTeams[1], this.lobby);
                } break;
                case 'threes': {
                    if (teamSelection == 'captains') {
                        await this.getCaptainsTeams(3).then((teams) => {
                            this.teams.blue = new TeamData(teams[0], this.lobby);
                            this.teams.orange = new TeamData(teams[1], this.lobby);
                        }).catch(console.error);
                    }
                    else {
                        const generatedTeams = (teamSelection == 'balanced') ? this.getBalancedTeams(3) : this.getRandomTeams(3);
                        this.teams.blue = new TeamData(generatedTeams[0], this.lobby);
                        this.teams.orange = new TeamData(generatedTeams[1], this.lobby);
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
            this.gameDataLog(
                [`[style=bold][fg=green]${this.getTeamMembersLog(bestTeams[0], bestTeams[1])}[/>]`, bestTeams],
                "team",
                {autoColorize: false}
            );
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
        async getCaptainsTeams(size = 3) {
            return new Promise(async (resolve) => {    
                // Sort players by MMR in descending order
                const playerArray = Object.values(this.players);
                const sortedPlayers = playerArray.sort((a, b) => b.stats.global.mmr - a.stats.global.mmr);
                const availablePlayers = [sortedPlayers[2], sortedPlayers[3], sortedPlayers[4], sortedPlayers[5]];
    
                // Select the first two players as captains
                const captain1 = sortedPlayers[0];
                const captain2 = sortedPlayers[1];
                var targetCaptain = captain1;

                // Create the teams
                const team1 = [captain1];
                const team2 = [captain2];

                const voteTime = () => {
                    const time = new Date();
                    const timeLeft = this.captainSelectionTime;
                    const secondsLeft = Math.floor((timeLeft - time) / 1000);
                    return new Date(time.getTime() + ((secondsLeft / (availablePlayers.length - 1) * 1000)));
                }

                this.captainSelectionTime = new Date(new Date().setSeconds(new Date().getSeconds() + this.captainSelectionTotalTime)).getTime();

                // Send a message to the channel with buttons for each player, and have the captains select their players
                //#region Message
                    const getPlayerButtons = (players) => {
                        const buttons = [];
                        for (const player of players) {
                            buttons.push(
                                new MessageButton({
                                    customId: `gameData_captainChoice_${this.gameId}_${player._id}`,
                                    label: (player.userData.nickname) ? player.userData.nickname : player.userData.name, 
                                    style: 'PRIMARY', 
                                    disabled: false,
                                })
                            );
                        }
                        return buttons;
                    }
                    const getMessage = () => {
                        const content = (generalData.debugMode) ? 
                            `It's your turn to pick **${targetCaptain.userData.name}**` :
                            `It's your turn to pick <@${targetCaptain._id}>`;
                        const embeds = [new MessageEmbed({
                            title: 'Select your players',
                            description: [
                                `Click the buttons below to select your players.`,
                                `Total time Left: <t:${generalUtilities.generate.getTimestamp(this.captainSelectionTime)}:R>`,
                                `Captain vote time Left: <t:${generalUtilities.generate.getTimestamp(voteTime().getTime())}:R>`
                            ].join('\n'),
                            fields: [
                                {name: 'Captains', value: [captain1, captain2].map(player => `<@${player._id}>`).join(' '), inline: true},
                                {name: 'Team 1', value: team1.map(player => `<@${player._id}>`).join('\n'), inline: true},
                                {name: 'Team 2', value: team2.map(player => `<@${player._id}>`).join('\n'), inline: true},
                            ],
                            color: targetCaptain.userData.displayColor,
                        })];
                        const components = [new MessageActionRow().addComponents(getPlayerButtons(availablePlayers))]
                        
                        if (availablePlayers.length > 0) {
                            return {content: content, embeds: embeds, components: components}
                        }
                        return {content: content, embeds: embeds}
                    }
                    this.messages.captainSelect.content = getMessage();
                    if (Object.keys(this.messages.teamSelect.message).length > 0) {
                        this.messages.captainSelect.message = await clientSendMessage.editMessage(
                            this.channels.gameChat.id, 
                            this.messages.teamSelect.message.id, 
                            this.messages.captainSelect.content
                        );
                    }
                    else {
                        this.messages.captainSelect.message = await clientSendMessage.sendMessageTo(
                            this.channels.gameChat.id,
                            this.messages.captainSelect.content
                        );
                    }
                //#endregion
                
                /** 
                 * @param {MessageButton} btnPress
                */
                const filter = async (btnPress) => {
                    if (btnPress.type == 'MESSAGE_COMPONENT' && btnPress.customId.includes(`gameData_captainChoice_${this.gameId}`)) {
                        btnPress.deferUpdate();
                        if (btnPress.user.id == targetCaptain._id) {
                            return true;
                        }
                    }
                };
                const btnCollector = await this.channels.gameChat.createMessageComponentCollector({ filter, time: this.captainSelectionTotalTime * 1000 });
                
                await btnCollector.on('collect', async (m) => {
                    if (m.customId.includes(`gameData_captainChoice_${this.gameId}`)) {
                        if (m.user.id == targetCaptain._id) {
                            // console.log(m);
                            // console.log(targetCaptain.userData.name + ' selected ' + m.customId.split('_')[3]);
                            const selectedPlayer = this.players[m.customId.split('_')[3]];
                            availablePlayers.splice(availablePlayers.indexOf(selectedPlayer), 1);
                            if (targetCaptain == captain1) {
                                team1.push(selectedPlayer);
                                targetCaptain = captain2;
                            } else {
                                team2.push(selectedPlayer);
                            }

                            if (availablePlayers.length == 1) {
                                team1.push(availablePlayers[0]);
                                availablePlayers.splice(0, 1);
                                // console.log(this.messages);
                                // return;
                                resolve([team1, team2]);
                            }
                            else {
                                this.messages.captainSelect.content = getMessage();
                                await this.messages.captainSelect.message.edit(this.messages.captainSelect.content);
                            }
                        }
                    }
                });
    
                // Return the teams
                setTimeout(() => resolve([team1, team2]), this.captainSelectionTime - new Date().getTime());
                // return [team1, team2];
            });
        }

        getTeamMembersLog(teamX, teamY) {
            var output = '';
            for (let i = 0; i < 2; i++) {
                const team = i == 0 ? teamX : teamY;
                for (const data in team) {
                    output += team[data].userData.name + ' ';
                }
                output += (i == 1) ? '' : '\n';
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
            // Get the queue configuration and the region roles
            const regionRoles = this.queueConfig.roleSettings.regionRoles;
            const logMessages = [];
        
            // Initialize counters for each region
            const regionCounts = {};
            for (const regionRole of regionRoles) {
                regionCounts[regionRole.region] = {
                    count: 0,
                    neighbours: 0,
                    score: (regionRole.tieBreaker) ? 1 : 0,
                    // neighbourRegions: regionRole.neighbours
                };
            }
        
            // Count the number of players in each region
            for (const player in this.players) {
                const memberData = await generalUtilities.info.getMemberById(player);
                for (const regionRole of regionRoles) {
                    if (memberData._roles.includes(regionRole.role.id)) {
                        const region = regionRole.region;
                        regionCounts[region].count++;
                    }
                }
            }

            // Count the number of players in each region's neighbours and add it to the neighbour count
            for (const region in regionCounts) {
                const targetRegion = regionRoles.find(x => x.region == region);
                if (!targetRegion) { continue; }
    
                for (const neighbour of targetRegion.neighbours) {
                    if (regionCounts[neighbour]) {
                        regionCounts[neighbour].neighbours += regionCounts[region].count;
                    }
                }
            }

            // Calculate the score for each region
            for (const region in regionCounts) {
                regionCounts[region].score = regionCounts[region].count + regionCounts[region].neighbours;
            }
        
            
            // Find the region with the most players
            let bestRegionName = 'EU';
            let bestScore = 0;
            for (const [region, {score}] of Object.entries(regionCounts)) {
                if (score > bestScore) {
                    bestRegionName = region;
                    bestScore = score;
                }
                else if (score == bestScore) {
                    let rng = generalUtilities.generate.getRandomInt(0, 1);
                    let otherRegion = (rng > 0) ? region : bestRegionName;
                    bestRegionName = (rng == 0) ? region : bestRegionName;

                    logMessages.push(`[fg=yellow]Randomly selected[/>] [fg=green]${bestRegionName}[/>] [fg=cyan]over[/>] [fg=red]${otherRegion}[/>]: ${rng}`);
                }
            }
            let bestRegion = regionRoles.find(x => x.region == bestRegionName);
            
            logMessages.push(`[fg=green]Chosen Region[/>]: ${bestRegion.regionDisplay} | ${bestScore}`); // Debugging line to check the region with the most players
            logMessages.push(regionCounts); // Debugging line to check the region counts
            this.gameDataLog(logMessages, "region");
            this.region = bestRegion;
        }

        gameDataLog(msg, type = null, logOptions = null) {
            if (type == null) {
                cConsole.log(`\n-------- [fg=green]Game Data[/>] --------`);
                if (typeof msg == "object") {
                    console.log(msg);
                }
                else if (Array.isArray(msg)) {
                    for (let i = 0; i < msg.length; i++) {
                        if (typeof msg[i] == "object") {
                            console.log(msg[i]);
                        }
                        else {
                            cConsole.log(msg[i], logOptions);
                        }
                    }
                }
                else {
                    cConsole.log(msg, logOptions);
                }
            }
            else {
                if (!generalData.logOptions.gameData[type]) { return; }
                cConsole.log(`\n-------- [fg=green]Game Data[/>] [fg=cyan]${type}[/>] --------`);
                if (typeof msg == "object" && !Array.isArray(msg)) {
                    console.log(msg);
                }
                else if (Array.isArray(msg)) {
                    for (let i = 0; i < msg.length; i++) {
                        if (typeof msg[i] == "object") {
                            console.log(msg[i]);
                        }
                        else {
                            cConsole.log(msg[i], logOptions);
                        }
                    }
                }
                else {
                    cConsole.log(msg, logOptions);
                }
            }
        }
        /* GPT: 
            This function first initializes a counter for each region,
            then counts the number of players in each region.
            It then finds the region with the most players and stores it in maxRegion.
            If there is a tie,
            it iterates through the neighboring regions of the region with the most players and checks if there are any players in those regions.
            If it finds a region with players,
            it sets this.
            region to the display name of that region and returns.
            If it doesn't find a neighboring region with players,
            or if there is no tie,
            it sets this.
            region to a random region using the generate.
            getRandomInt() function.
        */

        // async getGameRegion() {
        //     const queueConfig = await getQueueConfig();
        //     const euRole = (queueConfig.roleSettings.regionEU.id) ? queueConfig.roleSettings.regionEU : null;
        //     const usRole = (queueConfig.roleSettings.regionUS.id) ? queueConfig.roleSettings.regionUS : null;

        //     var euPlayers = 0;
        //     var usPlayers = 0;
        //     for (const player in this.players) {
        //         const memberData = await generalUtilities.info.getMemberById(player);
        //         if (!euRole || !usRole) continue;
        //         if (memberData._roles.includes(euRole.id)) { euPlayers++; }
        //         if (memberData._roles.includes(usRole.id)) { usPlayers++; }
        //     }
        //     // console.log('eu: ' + euPlayers + ' | us: ' + usPlayers + ' | ' + (euPlayers >= usPlayers ? 'eu' : 'us'));
        //     if (usPlayers > euPlayers) {
        //         this.region = 'US-East';
        //     }
        //     else if (euPlayers == usPlayers) {
        //         const num = generalUtilities.generate.getRandomInt(0, 1);
        //         this.region = (num == 0) ? 'US-East' : 'EU';
        //     }
        // }
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
        game.lobbyChannel = await generalData.client.guilds.cache.get(guildId).channels.cache.get(game.lobbyChannelId);
        
        globalQueueData.gamesInProgress.push(game);
        if (generalData.logOptions.gameData.general) console.log(globalQueueData.gamesInProgress);

        if (await queueSettings.getQueueDatabaseById(generalData.botConfig.defaultGuildId).then((data) => {
            return data.channelSettings.teamChannelCategory;
        })) { 
            queueGameChannels.createGameChannels(game);
        }
        else { clientSendMessage.sendMessageTo(game.lobbyChannelId, game.messages.queueStart.message); }
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