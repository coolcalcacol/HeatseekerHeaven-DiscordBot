const { SlashCommandBuilder,  } = require('@discordjs/builders');
const { Permissions, MessageActionRow, MessageSelectMenu, TextInputComponent, Modal } = require('discord.js');
const generalData = require('../../data/generalData.js');
const cConsole = require('../../utils/customConsoleLog');
const databaseUtilities = require('../../utils/databaseUtilities');
const clientSendMessage = require('../../utils/clientSendMessage');
const playerData = require('../../data/playerData');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!')
		.addUserOption(option => option
			.setName('target-user')
			.setDescription('Which user to get the data from to display')
			.setRequired(false)	
		),
	async execute(interaction) {
		if (!interaction.member.permissions.has([Permissions.FLAGS.ADMINISTRATOR])) {
            await interaction.reply({
                ephemeral: true,
                content: 'You do not have permission to use this command.',
            }).catch(console.error);
            cConsole.log(`[style=bold][fg=red]${interaction.user.username}[/>] Has been [fg=red]denied[/>] to use this command`);
            return;
        }
		console.log(interaction.user)
		var data;
		const target = interaction.options.getUser('target-user') ? 
			interaction.options.getUser('target-user') :
			interaction.user
		;
		const queueSettingsData = await queueSettings.getQueueDatabaseById(interaction.guild.id).catch(console.error);
		await playerData.getPlayerDataById(target.id, true, queueSettingsData)
			.then(async (foundData) => {
				data = foundData;
			});
		interaction.reply({
			ephemeral: true,
			content: '```js\n' + data + '```'
		});
		

		// -- MessageAction
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
		// --

		// -- Create the modal
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
		// --
	},
};