const fs = require('fs');
const Database = require('./data/database/database.js');
const cConsole = require('./utils/customConsoleLog');
// Require the necessary discord.js classes
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config/private.json');
// const { prefix } = require('./config/config.json');
const mmrCalculator = require('./data/mmrCalculator');

const db = new Database();
db.connect();

// Create a new client instance
const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES
	]
});

client.commands = new Collection();
client.messageActions = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

// Get all the commands from the files in the commands folder
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}
function getCommandFiles(dir, type = 'commands') {
	const commandFiles = fs.readdirSync('./' + dir);
	for (const file of commandFiles) {
		if (file.endsWith('.js')) {
			registerCommand(dir, file, type);
		}
		else if (file.match(/[a-zA-Z0-9 -_]+/i)) {
			if (file == 'Archive') { continue; }
			if (file == 'MessageActions') {
				getCommandFiles(dir + '/' + file, 'messageActions');
				continue;
			}
			getCommandFiles(dir + '/' + file, type);
		}
	}
}
function registerCommand(dir, file, type) {
	const command = require(`./${dir}/${file}`);
	cConsole.log(`Registering [fg=blue]${type}[/>]: [fg=green]${command.data.name}[/>]`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	if (type == 'commands') {
		client.commands.set(command.data.name, command);
	}
	else if (type == 'messageActions') {
		client.messageActions.set(command.data.name, command);
	}
}
getCommandFiles('commands');

// Get all the events from the files in the events folder
for (const file of eventFiles) {
	const event = require(`./events/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	}
	else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

// When a command is trigger this creates a new interaction event
client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) executeCommand(interaction);
	else if (interaction.isButton()) executeButton(interaction);
	else if (interaction.isSelectMenu()) executeSelectMenue(interaction);
});

async function executeCommand(interaction) {
	const command = client.commands.get(interaction.commandName);
	
	if (!command) return;
	try {
		await command.execute(interaction);
		// cConsole.log(command);
	} catch (error) {
		// await interaction.reply({content: 'There was an error while executing this command!' + '\n\`\`\`' + error + '\`\`\`'});
		cConsole.log('Error: ' + error.message);
		console.log(error.stack);
	}
}
async function executeButton(interaction) {
	const buttonTarget = interaction.customId.split('_')[0] + '_buttons';
	const button = client.messageActions.get(buttonTarget);

	if (!button) return;
	try {
		await button.execute(interaction);
		// cConsole.log(command);
	} catch (error) {
		// await interaction.reply({content: 'There was an error while executing this command!' + '\n\`\`\`' + error + '\`\`\`'});
		cConsole.log('Error: ' + error.message);
		console.log(error.stack);
	}
}
async function executeSelectMenue(interaction) {
	const selectTarget = interaction.customId.split('_')[0] + '_select';
	const selectMenue = client.messageActions.get(selectTarget);

	if (!selectMenue) return;
	try {
		await selectMenue.execute(interaction);
		// cConsole.log(command);
	} catch (error) {
		// await interaction.reply({content: 'There was an error while executing this command!' + '\n\`\`\`' + error + '\`\`\`'});
		cConsole.log('Error: ' + error.message);
		console.log(error.stack);
	}
}

// client.on('interactionCreate', async interaction => {
// 	if (!interaction.isSelectMenu()) return;

// 	if (interaction.customId === 'select') {
// 		console.log(interaction)
// 		await interaction.update({ content: 'Something was selected!', components: [] });
// 	}
// });
// client.on('interactionCreate', async interaction => {
// 	if (!interaction.isModalSubmit()) return;
// 	// Get the data entered by the user
// 	const favoriteColor = interaction.fields.getTextInputValue('favoriteColorInput');
// 	const hobbies = interaction.fields.getTextInputValue('hobbiesInput');
// 	console.log({ favoriteColor, hobbies });
// 	await interaction.reply({
// 		content: 'You submited ' + favoriteColor + ' succesfully!'
// 	})
// });

// Login to Discord with your client's token
client.login(token);
// console.log(client.messageActions);

module.exports.info = {
	database: db
}
