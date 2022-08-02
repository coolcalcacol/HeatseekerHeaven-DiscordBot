const mongoose = require('mongoose');

const GuildSettingsSchema = new mongoose.Schema({
    _id: String,
    bypassUsers: Array,
});

module.exports = mongoose.model('GuildSettings', GuildSettingsSchema);