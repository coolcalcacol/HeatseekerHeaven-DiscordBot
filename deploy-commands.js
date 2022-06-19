const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config/private.json');
const { cConsole } = require('./utils/utilityManager.js');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	const commandData = command.data.toJSON();
	
	commands.push(commandData);
	cConsole.log('[fg=cyan]' + commandData.name + '[/>]');
}

const rest = new REST({ version: '9' }).setToken(token);
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => cConsole.log('Successfully registered application commands.'))
	.catch(() => console.log(error));
