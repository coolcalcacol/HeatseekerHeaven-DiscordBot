const mongoose = require('mongoose');

const BotConfigSchema = new mongoose.Schema({
    _id: String,
    bypassUsers: Array,
});

module.exports = mongoose.model('BotConfigDatabase', BotConfigSchema);