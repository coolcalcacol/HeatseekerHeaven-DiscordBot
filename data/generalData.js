// const { cConsole } = require('../utils/utilityManager.js');

module.exports = {
    client: null,
    debugMode: true,
    botConfig: {
        defaultGuildId: '811667577985302528',
    },
    debugOptions: {
        createGameOnStart: true,
        gameOnStartLobby: 'threes'
    },
    logOptions : {
        interactions: true,
        database: false,
        queueAdmin: true,
        playerData: true,
        getPlayerData: false,
        gameData: false,
        teamGeneration: false,
        gameMmrResults: false,
        queueSettings: false,
        queueConfigCommands: false,
    },
}