const { Client } = require('discord.js');
const config = require('../config/config.json');
const cConsole = require('./customConsoleLog.js');


module.exports = {
    client: null,
    setClient(client) {
        this.client = client;
    },
    sendMessageTo(channelID, msg) {
        this.client.channels.cache.get(channelID).send(msg);
    },
    sendTestMessage(msg) {
        const channel = this.client.channels.cache.get(config.testChannel);
        channel.send(msg);
    },
    sendLogMessage(msg) {
        const channel = this.client.channels.cache.get(config.logChannel);
        channel.send(msg);
    }
}