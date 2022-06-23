const config = require('../config/config.json');
const cConsole = require('./customConsoleLog.js');
const generalData = require('../data/generalData.js');


function setClient(client) {
    generalData.client = client;
}
function sendMessageTo(channelID, msg) {
    generalData.client.channels.cache.get(channelID).send(msg);
}
function sendEmbedMessageTo(channelId, embed) {
    generalData.client.channels.cache.get(channelId).send({embeds: embed});
}
function sendTestMessage(msg) {
    const channel = generalData.client.channels.cache.get(config.channels.test);
    channel.send(msg);
}
function sendLogMessage(msg) {
    const channel = generalData.client.channels.cache.get(config.channels.log);
    channel.send(msg);
}

module.exports = {
    client: null,
    setClient,
    sendMessageTo,
    sendEmbedMessageTo,
    sendTestMessage,
    sendLogMessage
}