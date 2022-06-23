const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const { cConsole, clientSendMessage, embedUtilities, databaseUtilities } = require('../utils/utilityManager.js');
const queueData = require('../data/queue.js');

const userWhitelist = [
    '306395424690929674',
    '479936093047750659',
    '280432147695665163',
    '599339755662082057',
    '688819598686289952',
    '988513771452526623',
    '614257446654967813',
    '287657356312051724',
    '399024946631802891',
    '465960027400830980',
    '267442458638417921',
]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fillqueue')
        .setDescription('Fills the queue with random people to test the queue system'),
    async execute(interaction) {
        if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
            interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
            return
        }

        const lobby = await databaseUtilities.getRankedLobby(interaction.channel);
        if (!lobby) {
            await interaction.reply({
                content: 'Something went wrong.... This is probably not the right channel for this command.', 
                ephemeral: true
            });
            return;
        }
        await queueData.actions.fillQueueWithPlayers(userWhitelist, lobby);
        
        await interaction.client.emit('queueEvent', interaction, 'add');
        await interaction.reply({
            embeds: embedUtilities.presets.queueStatusEmbed(lobby, 'User entered Queue')
        });
    },
};