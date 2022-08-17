const mongoose = require('mongoose');

const QueueDataSchema = new mongoose.Schema({
    _id: String,
    userBlacklist: {type: Object, default: {}},
});

module.exports = mongoose.model('QueueDatabase', QueueDataSchema);