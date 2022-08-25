const { SlashCommandBuilder } = require('@discordjs/builders');
const queueData = require('../data/queueData');
const embedUtilities = require('../utils/embedUtilities');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('teams')
        .setDescription('Displays the current teams'),
    async execute(interaction) {
        const playerStatus = await queueData.info.userReservedStatus(interaction.user.id, true);

        if (typeof playerStatus == 'object') {
            await interaction.reply({
                ephemeral: true,
                content: `Teams for Game \`${playerStatus.gameId}\``,
                embeds: embedUtilities.presets.queueGameStartPreset(playerStatus, true)
            }).catch(console.error);
        }
        else {
            await interaction.reply({
                ephemeral: true,
                content: 'You are not in an ongoing game'
            }).catch(console.error);
        }
    },
};