const cConsole = require('../utils/customConsoleLog');
const { prefix } = require('../config/config.json');

const interactionFields = [
	'applicationId',
	'channel',
	'channelId',
	'client',
	'createdAt',
	'createdTimestamp',
	'guild',
	'guildId',
	'guildLocale',
	'id',
	'locale',
	'member',
	'memberPermissions',
	'token',
	'type',
	'user',
	'version',
];

module.exports = {
	name: 'messageCreate-',
	once: true,
	async execute(message) {
		const client = message.client;
		if (message.content.startsWith(prefix)) {
			const newInteraction = {};
			newInteraction.user = message.author;
			for (let i = 0; i < interactionFields.length; i++) {
				const key = interactionFields[i];
				const value = message[interactionFields[i]];
				if (!value) {continue;}

				cConsole.log(key + ': ' + value);
				newInteraction[key] = value;
			}
			cConsole.log(newInteraction, { unfoldJsonObjects: false });

			client.emit('interactionCreate', newInteraction);
			// if (!interaction.isCommand()) return;
			// const command = client.commands.get(interaction.commandName);

			// if (!command) return;
			// try {
			//     await command.execute(interaction, interaction.options);
			//     // cConsole.log(command);
			// } catch (error) {
			//     await interaction.reply({content: 'There was an error while executing this command!' + '\n\`\`\`' + error + '\`\`\`'});
			//     cConsole.log(error);
			// }
		}
		cConsole.log(`Message Create Event: \n${message.content}`);
	},
};