const mongoose = require('mongoose');

const GuildDataSchema = new mongoose.Schema({
    _id: String,
});

module.exports = mongoose.model('GuildDatabase', GuildDataSchema);