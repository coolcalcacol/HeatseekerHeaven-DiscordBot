// const { cConsole } = require('../utils/utilityManager.js');

module.exports = {
    client: null,
    debugMode: true,
    botConfig: {
        defaultGuildId: '811667577985302528',
    },
    debugOptions: {
        createGameOnStart: false,
        gameOnStartLobby: 'threes'
    },
    logOptions : {
        interactions: true,
        database: false,
        gameData: false,
        teamGeneration: false,
        gameMmrResults: true,
        playerData: false,
        queueSettings: true,
        queueAdmin: true,
    },
}