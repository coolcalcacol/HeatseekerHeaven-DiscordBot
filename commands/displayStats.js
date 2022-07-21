
const { SlashCommandBuilder } = require('@discordjs/builders');
const EmbedUtilities = require('../utils/embedUtilities');
const PlayerData = require('../data/playerData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Check your stats'),
    async execute(interaction) {
        await interaction.reply({
            embeds: [EmbedUtilities.presets.playerStatsPreset(await PlayerData.getPlayerDataById(interaction.user.id))]
        })
    },
};