const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
    _id: String,
    adminRole: String
});

module.exports = mongoose.model('GuildConfigDatabase', GuildConfigSchema);