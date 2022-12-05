const mongoose = require('mongoose');

const GuildDataSchema = new mongoose.Schema({
    _id: String,
    // activeTimers: {type: Object, default: {}},
});

module.exports = mongoose.model('GuildDatabase', GuildDataSchema);