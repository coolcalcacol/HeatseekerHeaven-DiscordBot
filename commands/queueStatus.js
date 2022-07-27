const { SlashCommandBuilder } = require('@discordjs/builders');
const cConsole = require('../utils/customConsoleLog');
const databaseUtilities = require('../utils/databaseUtilities');
const embedUtilities = require('../utils/embedUtilities');
// const queueData = require('../data/queue.js');
const queueSettings = require('../data/queueSettings');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Replies with the current queue status'),
    async execute(interaction) {
        const lobby = await queueSettings.getRankedLobbyById(interaction.channel, interaction.guild.id);
        if (!['ones', 'twos', 'threes'].includes(lobby)) {
            await interaction.reply({
                content: 'Something went wrong.... This is probably not the right channel for this command.', 
                ephemeral: true
            });
            return;
        }
        await interaction.reply({
            embeds: embedUtilities.presets.queueStatusEmbed(lobby, 'status')
        });
    },
};