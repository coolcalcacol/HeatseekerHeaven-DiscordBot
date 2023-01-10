const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton } = require('discord.js');
// const { MessageButtonStyles } = require('discord.js/typings/enums');
const embedUtilities = require('../utils/embedUtilities');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leaderboard')
		.setDescription('Shows the current leaderboard'),
	interactors: {},
	nextPageButton: new MessageButton({
		custom_id: 'leaderboard_next-page',
		label: 'Next Page',
		style: 'PRIMARY',
		disabled: false,
	}),
	prevPageButton: new MessageButton({
		custom_id: 'leaderboard_prev-page',
		label: 'Prev Page',
		style: 'PRIMARY',
		disabled: true,
	}),
	buttonRow: new MessageActionRow(),
	async execute(interaction) {
		this.validate(interaction, true);
		const currentPage = this.interactors[interaction.user.id].page;

		const response = await embedUtilities.presets.leaderboardPreset(currentPage, interaction, true);
		if (currentPage <= response[1]) this.nextPageButton.setDisabled(false);
		else this.nextPageButton.setDisabled(true);

		if (currentPage > 0) this.prevPageButton.setDisabled(false);
		else this.prevPageButton.setDisabled(true);

		await interaction.reply({
			ephemeral: true,
			embeds: response[0],
			components: [this.buttonRow],
		}).catch(console.error);
	},
	validate(interaction, initiation) {
		if (this.buttonRow.components.length === 0) {
			this.buttonRow.addComponents(this.prevPageButton, this.nextPageButton);
		}
		if (!this.interactors[interaction.user.id]) {
			this.interactors[interaction.user.id] = { page: 0 };
		}
		else if (initiation) {
			this.interactors[interaction.user.id].page = 0;
		}
	},
};
