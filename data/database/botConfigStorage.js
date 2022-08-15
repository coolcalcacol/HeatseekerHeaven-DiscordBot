const mongoose = require('mongoose');

const BotConfigSchema = new mongoose.Schema({
    _id: String,
    bypassUsers: {type: Object, default: {}},
});

module.exports = mongoose.model('BotConfigDatabase', BotConfigSchema);