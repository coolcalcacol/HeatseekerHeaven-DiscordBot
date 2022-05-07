const fs = require('fs');
const { cConsole } = require('./utils/utilityManager.js');
// Require the necessary discord.js classes
const { Client, Collection, Intents } = require('discord.js');
const { token } = require('./config/private.json');
// const { prefix } = require('./config/config.json');

// Create a new client instance
const client = new Client({ 
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES
	]
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

// Get all the commands from the files in the commands folder1312
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

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
	if (!interaction.isCommand()) return;
	const command = client.commands.get(interaction.commandName);

	if (!command) return;
	try {
		await command.execute(interaction, client);
		// cConsole.log(command);
	} catch (error) {
		await interaction.reply({content: 'There was an error while executing this command!' + '\n\`\`\`' + error + '\`\`\`'});
		cConsole.log('Error: ' + error.message);
		cConsole.log(error.stack);
	}
});

// Login to Discord with your client's token
client.login(token);
