
const { SlashCommandBuilder } = require('@discordjs/builders');
const EmbedUtilities = require('../utils/embedUtilities');
const PlayerData = require('../data/playerData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Check your stats')
        .addStringOption(option => option
            .setName('mode')
            .setDescription('The game mode to show your stats for [Default = global]')
            .setRequired(false)
                .addChoice('1v1', 'ones')
                .addChoice('2v2', 'twos')
                .addChoice('3v3', 'threes')
                .addChoice('global', 'global')
        )
        .addUserOption(option => option
            .setName('target-user')
            .setDescription('Which user to show the stats for')
            .setRequired(false)
        ),
    async execute(interaction) {
        const userId = interaction.options.get('target-user') ? 
            interaction.options.get('target-user').user.id : interaction.user.id;
        const mode = interaction.options.getString('mode') ? 
            interaction.options.getString('mode') : 'global';
        const data = await PlayerData.getPlayerDataById(userId);

        if (!data) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have any stats yet. You need to Queue first.'
            });
            return;
        }
        await interaction.reply({
            embeds: [EmbedUtilities.presets.playerStatsPreset(data, mode)]
        })
    },
};