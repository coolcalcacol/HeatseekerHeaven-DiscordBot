const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const cConsole = require('../utils/customConsoleLog');
const databaseUtilities = require('../utils/databaseUtilities');
const embedUtilities = require('../utils/embedUtilities');
const queueData = require('../data/queueData.js');

const userWhitelist = [
    '479936093047750659',
    '280432147695665163',
    '599339755662082057',
    '688819598686289952',
    '614257446654967813',
    '287657356312051724',
    '399024946631802891',
    '465960027400830980',
    '267442458638417921',
    '371465297477238784',
    '437259152574906368',
    '138115007983517697',
]

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fillqueue')
        .setDescription('Fills the queue with random people to test the queue system')
        .addNumberOption(option => option
            .setName('queueamount')
            .setDescription('Enter the numbers of players added to the queue')
            .setRequired(false)
        ),
    async execute(interaction) {
        if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
            interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
            return
        }

        const lobby = await databaseUtilities.get.getRankedLobbyById(interaction.channel);
        if (!lobby) {
            await interaction.reply({
                content: 'Something went wrong.... This is probably not the right channel for this command.', 
                ephemeral: true
            });
            return;
        }
        var queueAmount = interaction.options.getNumber('queueamount');
        if (queueAmount == 0 || queueAmount == null) {queueAmount = 6;}
        await queueData.actions.fillQueueWithPlayers(userWhitelist, lobby, queueAmount);
        
        await interaction.client.emit('queueEvent', interaction, 'add');
        await interaction.reply({
            embeds: embedUtilities.presets.queueStatusEmbed(lobby, 'add', interaction)
        });
    },
};