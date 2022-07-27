// const { cConsole } = require('../utils/utilityManager.js');

module.exports = {
    client: null,
    debugMode: true,
    debugOptions: {
        createGameOnStart: false,
        gameOnStartLobby: 'twos'
    },
    logOptions : {
        interactions: true,
        database: false,
        gameData: false,
        teamGeneration: false,
        gameMmrResults: false,
        playerData: false,
        queueSettings: true,
    },
}