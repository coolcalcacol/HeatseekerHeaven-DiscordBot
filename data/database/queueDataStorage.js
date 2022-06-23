const mongoose = require('mongoose');

const QueueDataSchema = new mongoose.Schema({
    matchId: Number,
    channelSettings: {
        onesChannel: String,
        twosChannel: String,
        threesChannel: String,
        matchReportChannel: String,
    }
});

module.exports = mongoose.model('QueueDatabase', QueueDataSchema);