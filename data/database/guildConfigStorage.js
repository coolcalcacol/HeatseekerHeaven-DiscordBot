const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
    _id: String,
    adminRoles: {type: Object, default: {}}
});

module.exports = mongoose.model('GuildConfigDatabase', GuildConfigSchema);