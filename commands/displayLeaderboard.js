const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
// const { MessageButtonStyles } = require('discord.js/typings/enums');
const embedUtilities = require('../utils/embedUtilities')
const generalData = require('../data/generalData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the current leaderboard'),
    async execute(interaction) {
        var currentPage = 0;

        const nextPageButton = new MessageButton({
            custom_id: 'lb_next-page',
            label: 'Next Page',
            style: 'PRIMARY',
            disabled: false
        });
        const prevPageButton = new MessageButton({
            custom_id: 'lb_prev-page',
            label: 'Prev Page',
            style: 'PRIMARY',
            disabled: true
        });
        
        const buttonRow = new MessageActionRow().addComponents(prevPageButton, nextPageButton);

        const response = await embedUtilities.presets.leaderboardPreset(currentPage, true);
        if (response[1] <= currentPage) nextPageButton.setDisabled(true);
        await interaction.reply({
            ephemeral: true,
            embeds: response[0],
            components: [buttonRow]
        }).catch(console.error);
        
        generalData.client.on('interactionCreate', async btnI => {
            if (!btnI.isButton()) return;
            
            if (btnI.customId === 'lb_next-page') {
                currentPage++;
                const response = await embedUtilities.presets.leaderboardPreset(currentPage, true);
                if (currentPage >= response[1]) nextPageButton.setDisabled(true);
                prevPageButton.setDisabled(false);

                await btnI.update({
                    ephemeral: true,
                    embeds: response[0],
                    components: [buttonRow]
                }).catch(console.error);
                return;
            }
            else if (btnI.customId === 'lb_prev-page') {
                currentPage--;
                const response = await embedUtilities.presets.leaderboardPreset(currentPage, true);
                if (currentPage <= 0) prevPageButton.setDisabled(true);
                nextPageButton.setDisabled(false);

                await btnI.update({
                    ephemeral: true,
                    embeds: response[0],
                    components: [buttonRow]
                }).catch(console.error);
                return;
            }
        });
    },
};