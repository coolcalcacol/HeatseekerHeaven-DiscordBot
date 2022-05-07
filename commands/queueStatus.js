const { SlashCommandBuilder } = require('@discordjs/builders');
const queueData = require('../data/queue.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Replies with the current queue status'),
    async execute(interaction) {
        await interaction.reply(queueData.info.getCurrentQueueMessage(interaction, 'ones'));
    },
};