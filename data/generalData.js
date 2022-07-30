// const { cConsole } = require('../utils/utilityManager.js');

module.exports = {
    client: null,
    debugMode: true,
    botConfig: {
        defaultGuildId: '811667577985302528',
    },
    debugOptions: {
        createGameOnStart: true,
        gameOnStartLobby: 'ones'
    },
    logOptions : {
        interactions: true,
        database: false,
        queueAdmin: true,
        playerData: false,
        gameData: false,
        teamGeneration: false,
        gameMmrResults: true,
        queueSettings: false,
        queueConfigCommands: false,
    },
}