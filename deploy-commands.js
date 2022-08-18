const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config/private.json');
const cConsole = require('./utils/customConsoleLog');

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
			if (file == 'Archive' || file == 'MessageActions') { continue; }
			getCommandFiles(dir + '/' + file);
		}
	}
}
function registerCommand(dir, file) {
	const command = require(`./${dir}/${file}`);
	const commandData = command.data.toJSON();

	commands.push(commandData);
	cConsole.log(`./[fg=green]${dir}[/>]/[fg=green]${file}[/>]` + ' - [fg=cyan]' + commandData.name + '[/>]');
}
getCommandFiles('commands');

const rest = new REST({ version: '9' }).setToken(token);
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
.then(() => cConsole.log('Successfully registered application commands for guild:\n.' + guildId + '\n'))
.catch(() => console.log(error));

// const guildId = guildIds[i];
// for (let i = 0; i < guildIds.length; i++) {
// 	const guildId = guildIds[i];
// 	rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
// 		.then(() => cConsole.log('Successfully registered application commands for guild:\n.' + guildId + '\n'))
// 		.catch(() => console.log(error));
// }
