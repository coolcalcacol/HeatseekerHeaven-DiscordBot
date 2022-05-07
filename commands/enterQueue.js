const { SlashCommandBuilder } = require('@discordjs/builders');
const { cConsole, clientSendMessage } = require('.. /utils/utilityManager.js');
const queueData = require('../data/queue.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Adds your to the queue'),
    async execute(interaction, client) {
        const response = queueData.actions.addPlayerToQueue(interaction, 'ones');
        if (response == 'enteredQueue') {
            await client.emit('queueEvent', interaction, 'add');
            await interaction.reply(queueData.info.getCurrentQueueMessage(interaction, 'ones'));
        }
        else if (response == 'alreadyInQueue') {
            await interaction.reply({
                content: 'You are already in the queue', 
                ephemeral: true
            });
        }
        else {
            await interaction.reply({
                content: 'Something went wrong.... I dont know what else to tell you here....', 
                ephemeral: true
            });
        }
    },
};