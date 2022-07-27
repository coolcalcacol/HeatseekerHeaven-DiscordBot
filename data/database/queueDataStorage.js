const mongoose = require('mongoose');

const QueueDataSchema = new mongoose.Schema({
    _id: String,
    gameId: {type: Number, default: 100},
    channelSettings: {
        onesChannel: {type: String, default: ''},
        twosChannel: {type: String, default: ''},
        threesChannel: {type: String, default: ''},
        matchReportChannel: {type: String, default: ''},
        vcWaitingRoom: {type: String, default: ''},
        logChannel: {type: String, default: ''},
    },
    mmrSettings: {
        startingMmr: {type: Number, default: 600}, // 600,
        baseGain: {type: Number, default: 15}, // 15,
        onesMultiplier: {type: Number, default: 0.5}, // 0.5,
        twosMultiplier: {type: Number, default: 0.85}, // 0.85,
        threesMultiplier: {type: Number, default: 1}, // 1,
        minStart: {type: Number, default: 100}, // 100,
        minCap: {type: Number, default: 0}, // 0,
        maxStart: {type: Number, default: 1500}, // 1500,
        maxCap: {type: Number, default: 2500}, // 2500,
    }
}, {timestamps: true});


module.exports = mongoose.model('QueueDatabase', QueueDataSchema);