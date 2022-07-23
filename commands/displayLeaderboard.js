const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
// const { MessageButtonStyles } = require('discord.js/typings/enums');
const embedUtilities = require('../utils/embedUtilities')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the current leaderboard'),
    async execute(interaction) {
        
        // const nextPageButton = new MessageButton();
        // const prevPageButton = new MessageButton();
        
        // nextPageButton.setCustomId('lb_next-page');
        // nextPageButton.setLabel('Next Page');
        // // nextPageButton.setStyle(MessageButtonStyles.PRIMARY);
        // nextPageButton.setDisabled(false);
        
        // prevPageButton.setCustomId('lb_prev-page');
        // prevPageButton.setLabel('Prev Page');
        // // prevPageButton.setStyle(MessageButtonStyles.PRIMARY);
        // prevPageButton.setDisabled(true);
        
        // const buttonRow = new MessageActionRow().addComponents(nextPageButton, prevPageButton);

        await interaction.reply({
            ephemeral: true,
            embeds: await embedUtilities.presets.leaderboardPreset(),
            // components: [buttonRow]
        });
    },
};