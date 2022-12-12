const { SlashCommandBuilder } = require('@discordjs/builders');
const leaderboardCommand = require('../../displayLeaderboard');
const embedUtilities = require('../../../utils/embedUtilities');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard_buttons'),
    async execute(interaction) {
        leaderboardCommand.validate(interaction);
        const context = interaction.customId.split('_')[1];
        var currentPage;

        if (context === 'next-page') {
            currentPage = leaderboardCommand.interactors[interaction.user.id].page + 1;
            leaderboardCommand.interactors[interaction.user.id].page = currentPage;
        }
        else if (context === 'prev-page') {
            currentPage = leaderboardCommand.interactors[interaction.user.id].page - 1;
            leaderboardCommand.interactors[interaction.user.id].page = currentPage;
        }
        
        const response = await embedUtilities.presets.leaderboardPreset(currentPage, interaction, true);
        var embed = response[0];
        if (currentPage < 0) {
            currentPage = 0;
            embed = await embedUtilities.presets.leaderboardPreset(currentPage, interaction);
        }
        if (currentPage > response[1]) {
            currentPage = response[1];
            embed = await embedUtilities.presets.leaderboardPreset(currentPage, interaction);
        }

        if (currentPage < response[1]) leaderboardCommand.nextPageButton.setDisabled(false);
        else leaderboardCommand.nextPageButton.setDisabled(true);

        if (currentPage > 0) leaderboardCommand.prevPageButton.setDisabled(false);
        else leaderboardCommand.prevPageButton.setDisabled(true);
        
        await interaction.update({
            ephemeral: true,
            embeds: embed,
            components: [leaderboardCommand.buttonRow]
        }).catch(console.error);
        return;
    },
};