const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu, TextInputComponent, Modal } = require('discord.js');
const generalData = require('../data/generalData.js');
const { cConsole, clientSendMessage } = require('../utils/utilityManager.js');
const playerData = require('../data/playerData');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.addStringOption(option => option.setName('name').setDescription('some description')),
	async execute(interaction) {
		var data;
		await playerData.getPlayerDataById(interaction.user.id, true)
			.then(async (foundData) => {
				console.log('Received PlayerData')
				data = foundData;
			});
		interaction.reply({
			content: '```js\n' + data + '```'
		});
		


		// const row = new MessageActionRow()
		// 	.addComponents(
		// 		new MessageSelectMenu()
		// 			.setCustomId('select')
		// 			.setPlaceholder('Nothing selected')
		// 			.setMinValues(2)
		// 			.setMaxValues(3)
		// 			.addOptions([
		// 				{
		// 					label: 'Select me',
		// 					description: 'This is a description',
		// 					value: 'first_option',
		// 				},
		// 				{
		// 					label: 'You can select me too',
		// 					description: 'This is also a description',
		// 					value: 'second_option',
		// 				},
		// 				{
		// 					label: 'I am also an option',
		// 					description: 'This is a description as well',
		// 					value: 'third_option',
		// 				},
		// 			]),
		// 	);
		// // Create the modal
		// const modal = new Modal()
		// .setCustomId('myModal')
		// .setTitle('My Modal');
		// // Add components to modal
		// // Create the text input components
		// const favoriteColorInput = new TextInputComponent()
		// 	.setCustomId('favoriteColorInput')
		// 	// The label is the prompt the user sees for this input
		// 	.setLabel("What's your favorite color?")
		// 	// Short means only a single line of text
		// 	.setStyle('SHORT');
		// const hobbiesInput = new TextInputComponent()
		// 	.setCustomId('hobbiesInput')
		// 	.setLabel("What's some of your favorite hobbies?")
		// 	// Paragraph means multiple lines of text.
		// 	.setStyle('PARAGRAPH');
		// // An action row only holds one text input,
		// // so you need one action row per text input.
		// const firstActionRow = new MessageActionRow().addComponents(favoriteColorInput);
		// const secondActionRow = new MessageActionRow().addComponents(hobbiesInput);
		// // Add inputs to the modal
		// modal.addComponents(firstActionRow, secondActionRow);
		
		// // await interaction.showModal(modal);
		// // await interaction.showModal(modal)
		// await interaction.reply({ 
		// 	content: 'Pong!', 
		// 	components: [row],
		// 	ephemeral: true
		// });
		// generalData.client.on('interactionCreate', async interaction => {
		// 	if (!interaction.isModalSubmit()) return;
		// 	// Get the data entered by the user
		// 	const favoriteColor = interaction.fields.getTextInputValue('favoriteColorInput');
		// 	const hobbies = interaction.fields.getTextInputValue('hobbiesInput');
		// 	console.log({ favoriteColor, hobbies });
		// 	await interaction.reply({
		// 		content: 'You submited **' + favoriteColor + '** succesfully!'
		// 	})
		// });
	},
};