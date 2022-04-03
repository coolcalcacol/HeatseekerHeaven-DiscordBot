const { SlashCommandBuilder } = require('@discordjs/builders');
const { cConsole, clientSendMessage, embedCreator } = require('../utilities/utilityManager.js');
const queueData = require('../data/queue.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave')
        .setDescription('Removes your from the queue'),
    async execute(interaction, client) {
        const response = queueData.actions.removePlayerFromQueue(interaction, 'ones');
        if (response == 'removedFromQueue') {
            await client.emit('queueEvent', interaction, 'remove');
            await interaction.reply(queueData.info.getCurrentQueueMessage(interaction, 'ones'));
        }
        else if (response == 'wasNotInQueue') {
            await interaction.reply({
                content: 'You where not in the queue.', 
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