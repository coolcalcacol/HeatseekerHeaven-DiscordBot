// const { cConsole } = require('../utils/utilityManager.js');
const { Client } = require('discord.js');

/** 
 * @param {Client} client
*/
module.exports = {
    client: null,
    debugMode: true,
    releasedVersion: false,
    botConfig: {
        defaultGuildId: '349360638088314881',
        botSetupGuildId: '811667577985302528',
    },
    generalQueueSettings: {
        pauseQueue: false,
    },
    debugOptions: {
        createGameOnStart: false,
        gameOnStartLobby: 'threes'
    },
    logOptions : {
        interactions: true,
        queueAdmin: true,
        userPermissions: false,
        database: false,
        playerData: false,
        getPlayerData: false,
        gameData: false,
        teamGeneration: false,
        gameMmrResults: false,
        gameReport: false,
        queueSettings: false,
        queueConfigCommands: false,
    },
    botStats: {
        upTime: null,
    },
    userWhitelist: [
        // '479936093047750659', // 888% [Bypass]
        // '382279435828723716', // FinnayBusiness [Bypass]
        '568449733228756993', // Bramble
        '371465297477238784', // lydipai
        '280432147695665163', // Joshh
        '138115007983517697', // klex
        '295244765547462656', // Acc70
        '653453312271581205', // RedRockGaming69
        '287657356312051724', // yur (Okey)
        '399024946631802891', // Wesh
        '457617584033103892', // Orcas
        '476834059431968772', // Hunter
        '465960027400830980', // Stockfish 13
        '437259152574906368', // Bobman
        '198802539783651328', // tavz
        '510829824483524638', // coco_ice
        '599339755662082057', // Darn
        '509407463565557761', // Quilln
        '862875902621777951', // Zerkoxito
        '700707631915991051', // Zebby
        '646927153614553122', // Mxnny
        '329135100308488192', // Omexy
        '434732958360797204', // TOG
        '723703418274971700', // j.
        '688819598686289952', // Lxyer
        '793278749138747423', // PogChamp
        '362052637400498187', // Senior Bubbles
        '492497679570436117', // CSmith_Games
        '95630080893521920',  // kaelan
        '393061621393784833', // Egol
        '467786597878857740', // DarthShadoww
        '439142243203416065', // N3O Monkey
        // '201039454930993152', // Marshmallow [left server]
        // '510636937489416196', // Nate [left server]
        // '178625919559270409', // ncj [left server]
        
    ]
}