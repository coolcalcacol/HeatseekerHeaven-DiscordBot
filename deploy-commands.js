const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config/private.json');
const { cConsole } = require('./utils/utilityManager.js');

const commands = [];
// const commandFiles = fs.readdirSync('./commands');
// const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));


function getCommandFiles(dir) {
	const commandFiles = fs.readdirSync('./' + dir);
	for (const file of commandFiles) {
		if (file.endsWith('.js')) {
			registerCommand(dir, file);
		}
		else if (file.match(/[a-zA-Z0-9 -_]+/i)) {
			if (file == 'Archive') { continue; }
			getCommandFiles(dir + '/' + file);
		}
	}
}
function registerCommand(dir, file) {
	const command = require(`./${dir}/${file}`);
	const commandData = command.data.toJSON();

	commands.push(commandData);
	cConsole.log(`./${dir}/${file}` + ' - [fg=cyan]' + commandData.name + '[/>]');
}
getCommandFiles('commands');

const rest = new REST({ version: '9' }).setToken(token);
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
	.then(() => cConsole.log('Successfully registered application commands.'))
	.catch(() => console.log(error));
