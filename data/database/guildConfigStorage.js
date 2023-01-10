const mongoose = require('mongoose');

const GuildConfigSchema = new mongoose.Schema({
	_id: String,
	superAdmins: { type: Object, default: {} },
	adminRoles: { type: Object, default: {} },
});

module.exports = mongoose.model('GuildConfigDatabase', GuildConfigSchema);