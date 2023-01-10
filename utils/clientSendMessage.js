// const config = require('../config/config.json');
const generalData = require('../data/generalData.js');


// function setClient(client) {
// 	generalData.client = client;
// }
async function sendMessageTo(channelID, msg) {
	const channel = await generalData.client.channels.cache.get(channelID);
	if (!channel) return;
	return await channel.send((msg) ? msg : 'ERROR').then((m) => { return m; }).catch(console.error);
}
// function sendEmbedMessageTo(channelId, embed) {
// 	generalData.client.channels.cache.get(channelId).send({ embeds: embed });
// }
async function editMessage(channelId, messageId, msg) {
	return await generalData.client.channels.cache.get(channelId).messages
		.fetch(messageId)
		.then((message) => {message.edit(msg); return message;})
		.catch(console.error);
}
// function sendTestMessage(msg) {
// 	const channel = generalData.client.channels.cache.get(config.channels.test);
// 	channel.send(msg);
// }
// function sendLogMessage(msg) {
// 	const channel = generalData.client.channels.cache.get(config.channels.log);
// 	channel.send(msg);
// }

module.exports = {
	client: null,
	sendMessageTo,
	editMessage,
};
