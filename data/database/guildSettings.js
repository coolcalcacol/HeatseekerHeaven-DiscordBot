const mongoose = require('mongoose');

const GuildSettingsSchema = new mongoose.Schema({
    guildId: String,
    welcomeChannelId: String
});

module.exports = mongoose.model('GuildSettings', GuildSettingsSchema);