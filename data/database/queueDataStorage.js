const mongoose = require('mongoose');

const QueueDataSchema = new mongoose.Schema({
    _id: String,
    gameId: Number,
    channelSettings: {
        onesChannel: String,
        twosChannel: String,
        threesChannel: String,
        matchReportChannel: String,
        vcWaitingRoom: String,
        logChannel: String,
    },
    mmrSettings: {
        baseGain: Number, // 15,
        startingMmr: Number, // 600,
        minStart: Number, // 100,
        minCap: Number, // 0,
        maxStart: Number, // 1500,
        maxCap: Number, // 2500,
        onesMultiplier: Number, // 0.5,
        twosMultiplier: Number, // 0.85,
        threesMultiplier: Number, // 1,
    }
}, {timestamps: true});


module.exports = mongoose.model('QueueDatabase', QueueDataSchema);