// const { cConsole } = require('../utils/utilityManager.js');

module.exports = {
    client: null,
    debugMode: true,
    debugOptions: {
        createGameOnStart: true,
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
    },
}