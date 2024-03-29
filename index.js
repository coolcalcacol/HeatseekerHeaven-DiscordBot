const fs = require('fs');
const Database = require('./data/database/database.js');
const cConsole = require('./utils/customConsoleLog');
// Require the necessary discord.js classes
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config/private.json');
const generalData = require('./data/generalData.js');
const generalUtilities = require('./utils/generalUtilities');
// const { prefix } = require('./config/config.json');
// const mmrCalculator = require('./data/mmrCalculator');

const db = new Database();
db.connect();

// Create a new client instance
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_VOICE_STATES,
	],
});

client.commands = new Collection();
client.messageActions = new Collection();
client.userContextActions = new Collection();
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
	const dirFiles = fs.readdirSync('./' + dir);
	for (const file of dirFiles) {
		if (file.endsWith('.js')) {
			registerCommand(dir, file, type);
		}
		else if (file.match(/[a-zA-Z0-9 -_]+/i)) {
			if (file === 'MessageActions') {
				getCommandFiles(dir + '/' + file, 'messageActions');
			}
			else if (file === 'ContextMenus') {
				getCommandFiles(dir + '/' + file, 'userContextActions');
			}
			else if (file !== 'Archive') {
				getCommandFiles(dir + '/' + file, type);
			}
		}
	}
}
function registerCommand(dir, file, type) {
	const command = require(`./${dir}/${file}`);
	cConsole.log(`Registering [fg=blue]${type}[/>]: [fg=green]${command.data.name}[/>]`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client[type].set(command.data.name, command);
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
	if (interaction.isCommand()) await executeCommand(interaction);
	else if (interaction.isUserContextMenu()) await executeUserContext(interaction);
	else if (interaction.isButton()) await executeButton(interaction);
	else if (interaction.isSelectMenu()) await executeSelectMenu(interaction);
});

async function executeCommand(interaction) {
	const command = client.commands.get(interaction.commandName);

	if (!command) return;
	try { await command.execute(interaction); }
	catch (error) {
		if (generalData.debugMode) {
			await interaction.reply({ content: 'There was an error while executing this command!' + '\n```' + error + '```' }).catch(console.error);
		}
		await generalUtilities.actions.handleError().createrr(client, interaction.channel.name, `${interaction.commandName}\`\`\` Executed by: ${interaction.user} \`\`\`User ID: ${interaction.user.id}`, error);
		cConsole.log('Error: ' + error.message);
		console.log(error.stack);
	}
}
async function executeUserContext(interaction) {
	const command = client.userContextActions.get(interaction.commandName);

	if (!command) return;
	try { await command.execute(interaction); }
	catch (error) {
		if (generalData.debugMode) {
			await interaction.reply({ content: 'There was an error while executing this command!' + '\n```' + error + '```' }).catch(console.error);
		}
		await generalUtilities.actions.handleError().createrr(client, interaction.channel.name, `${interaction.commandName}\`\`\` Executed by: ${interaction.user} \`\`\`User ID: ${interaction.user.id}`, error);
		cConsole.log('Error: ' + error.message);
		console.log(error.stack);
	}
}

async function executeButton(interaction) {
	const buttonTarget = interaction.customId.split('_')[0] + '_buttons';
	const button = client.messageActions.get(buttonTarget);

	if (!button) return;
	try { await button.execute(interaction); }
	catch (error) {
		if (generalData.debugMode) {
			await interaction.reply({ content: 'There was an error while executing this command!' + '\n```' + error + '```' }).catch(console.error);
		}
		await generalUtilities.actions.handleError().createrr(client, interaction.channel.name, `${interaction.customId}\`\`\` Executed by: ${interaction.user} \`\`\`User ID: ${interaction.user.id}`, error);
		cConsole.log('Error: ' + error.message);
		console.log(error.stack);
	}
}
async function executeSelectMenu(interaction) {
	const selectTarget = interaction.customId.split('_')[0] + '_select',
		selectMenu = client.messageActions.get(selectTarget);
	if (!selectMenu) return;
	try { await selectMenu.execute(interaction); }
	catch (error) {
		if (generalData.debugMode) {
			await interaction.reply({ content: 'There was an error while executing this command!' + '\n```' + error + '```' }).catch(console.error);
		}
		await generalUtilities.actions.handleError().createrr(client, interaction.channel.name, `${interaction.customId}\`\`\` Executed by: ${interaction.user} \`\`\`User ID: ${interaction.user.id}`, error);
		cConsole.log('Error: ' + error.message);
		console.log(error.stack);
	}
}

// Login to Discord with your client's token
client.login(token);

module.exports.info = {
	database: db,
};
