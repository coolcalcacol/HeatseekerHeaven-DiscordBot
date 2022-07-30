const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
// const { MessageButtonStyles } = require('discord.js/typings/enums');
const embedUtilities = require('../utils/embedUtilities')
const generalData = require('../data/generalData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Shows the current leaderboard'),
    interactors: {},
    nextPageButton: new MessageButton({
        custom_id: 'leaderboard_next-page',
        label: 'Next Page',
        style: 'PRIMARY',
        disabled: false
    }),
    prevPageButton: new MessageButton({
        custom_id: 'leaderboard_prev-page',
        label: 'Prev Page',
        style: 'PRIMARY',
        disabled: true
    }),
    buttonRow: new MessageActionRow(),
    async execute(interaction) {
        this.validate(interaction);
        var currentPage = this.interactors[interaction.user.id].page;
        
        const response = await embedUtilities.presets.leaderboardPreset(currentPage, interaction.user.id, true);
        if (currentPage <= response[1]) this.nextPageButton.setDisabled(false);
        else this.nextPageButton.setDisabled(true);

        if (currentPage > 0) this.prevPageButton.setDisabled(false);
        else this.prevPageButton.setDisabled(true);

        await interaction.reply({
            ephemeral: true,
            embeds: response[0],
            components: [this.buttonRow]
        }).catch(console.error);
        
        // generalData.client.on('interactionCreate', async btnI => {
        //     if (!btnI.isButton()) return;
            
        //     if (btnI.customId === 'leaderboard_next-page') {
        //         currentPage++;
        //         const response = await embedUtilities.presets.leaderboardPreset(currentPage, true);
        //         if (currentPage >= response[1]) nextPageButton.setDisabled(true);
        //         prevPageButton.setDisabled(false);

        //         await btnI.update({
        //             ephemeral: true,
        //             embeds: response[0],
        //             components: [buttonRow]
        //         }).catch(console.error);
        //         return;
        //     }
        //     else if (btnI.customId === 'leaderboard_prev-page') {
        //         currentPage--;
        //         const response = await embedUtilities.presets.leaderboardPreset(currentPage, true);
        //         if (currentPage <= 0) prevPageButton.setDisabled(true);
        //         nextPageButton.setDisabled(false);

        //         await btnI.update({
        //             ephemeral: true,
        //             embeds: response[0],
        //             components: [buttonRow]
        //         }).catch(console.error);
        //         return;
        //     }
        // });
    },
    validate(interaction) {
        if (this.buttonRow.components.length == 0) {
            this.buttonRow.addComponents(this.prevPageButton, this.nextPageButton);
        }
        if (!this.interactors[interaction.user.id]) {
            this.interactors[interaction.user.id] = {page: 0};
        }
    }
};