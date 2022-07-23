const mongoose = require('mongoose');

const QueueDataSchema = new mongoose.Schema({
    gameId: Number,
    channelSettings: {
        onesChannel: String,
        twosChannel: String,
        threesChannel: String,
        matchReportChannel: String,
    }
}, {timestamps: true});

module.exports = mongoose.model('QueueDatabase', QueueDataSchema);