const { SlashCommandBuilder } = require('@discordjs/builders');
const cConsole = require('../utils/customConsoleLog');
const databaseUtilities = require('../utils/databaseUtilities');
const embedUtilities = require('../utils/embedUtilities');
// const queueData = require('../data/queue.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Replies with the current queue status'),
    async execute(interaction) {
        const lobby = await databaseUtilities.get.getRankedLobbyById(interaction.channel);
        if (!lobby) {
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