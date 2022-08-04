const mongoose = require('mongoose');

const GuildSettingsSchema = new mongoose.Schema({
    _id: String,
    adminRole: String
});

module.exports = mongoose.model('GuildSettings', GuildSettingsSchema);