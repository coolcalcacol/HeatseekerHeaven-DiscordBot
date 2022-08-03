const mongoose = require('mongoose');

const BotSettingsSchema = new mongoose.Schema({
    _id: String,
    bypassUsers: Array,
});

module.exports = mongoose.model('BotSettings', BotSettingsSchema);