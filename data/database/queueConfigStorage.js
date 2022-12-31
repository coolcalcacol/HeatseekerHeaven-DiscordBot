const mongoose = require('mongoose');



const QueueConfigSchema = new mongoose.Schema({
    _id: String,
    gameId: {type: Number, default: 100},
    channelSettings: {
        onesChannel: {type: String, default: ''},
        twosChannel: {type: String, default: ''},
        threesChannel: {type: String, default: ''},
        matchReportChannel: {type: String, default: ''},
        autoQueue1VC: {type: String, default: ''},
        autoQueue2VC: {type: String, default: ''},
        autoQueue3VC: {type: String, default: ''},
        teamChannelCategory: {type: String, default: ''},
        logChannel: {type: String, default: ''},
    },
    mmrSettings: {
        startingMmr: {type: Number, default: 1000}, // 1000,
        baseGain: {type: Number, default: 50}, // 50,
        placementSettings: {
            modeBased: {type: Boolean, default: false}, // false, If the placement should be calculated for each more or just for global
            gain: {type: Number, default: 2}, // 2, is multiplied by the reselt of a game and decreased by the amount of games played
            gameCount: {type: Number, default: 10}, // 10,
        },
        onesMultiplier: {type: Number, default: 0.2}, // 0.2,
        twosMultiplier: {type: Number, default: 0.3}, // 0.3,
        threesMultiplier: {type: Number, default: 0.5}, // 0.5,
        minStart: {type: Number, default: 100}, // 100,
        minCap: {type: Number, default: 0}, // 0,
        maxStart: {type: Number, default: 1500}, // 1500,
        maxCap: {type: Number, default: 2500}, // 2500,
    },
    roleSettings: {
        regionRoles: {type: Array, default: []}, // [{name: 'US-East', role: {roleObject}, region: 'USE', neighbors: ['USW', 'EU']}]
        inActiveGameRole: {type: Object, default: {}},
        regionEU: {type: Object, default: {}},
        regionUS: {type: Object, default: {}},
    },
    rankRoles: {
        global: {type: Array, default: []},
        ones: {type: Array, default: []},
        twos: {type: Array, default: []},
        threes: {type: Array, default: []},
    },
    rankedPing: {
        role: {type: String, default: ''},
        cooldown: {type: Number, default: 1},
        currentCooldown: {type: Number, default: null}
    }
}, {timestamps: true});


module.exports = mongoose.model('QueueConfigDatabase', QueueConfigSchema);