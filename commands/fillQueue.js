const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions } = require('discord.js');
const cConsole = require('../utils/customConsoleLog');
const databaseUtilities = require('../utils/databaseUtilities');
const embedUtilities = require('../utils/embedUtilities');
const queueData = require('../data/queueData.js');
const queueSettings = require('../data/queueSettings');
const generalData = require('../data/generalData');

const userWhitelist = generalData.userWhitelist;

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
        if (interaction.user.id != '306395424690929674') {
            interaction.reply({
                content: 'You do not have permission to use this command.',
                ephemeral: true
            });
            return
        }

        const lobby = await queueSettings.getRankedLobbyById(interaction.channel, interaction.guild.id);
        if (!['ones', 'twos', 'threes'].includes(lobby)) {
            await interaction.reply({
                content: 'Something went wrong.... This is probably not the right channel for this command.', 
                ephemeral: true
            });
            return;
        }
        var queueAmount = interaction.options.getNumber('queueamount');
        if (queueAmount == 0 || queueAmount == null) {queueAmount = 6;}

        const queueSettingsData = await queueSettings.getQueueDatabaseById(interaction.guild.id).catch(console.error);
        await queueData.actions.fillQueueWithPlayers(userWhitelist, lobby, queueAmount, queueSettingsData);
        
        await interaction.client.emit('queueEvent', interaction, 'add');
        await interaction.reply({
            embeds: embedUtilities.presets.queueStatusEmbed(lobby, 'add', interaction)
        });
    },
};