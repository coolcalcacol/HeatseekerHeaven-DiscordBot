// const { cConsole } = require('../utils/utilityManager.js');

module.exports = {
    client: null,
    debugMode: true,
    debugOptions: {
        createGameOnStart: false,
        gameOnStartLobby: 'threes'
    },
    logOptions : {
        interactions: true,
        playerData: false,
        gameData: false,
        gameMmrResults: true,
    },
}