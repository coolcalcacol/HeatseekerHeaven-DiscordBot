const cConsole = require('../utils/customConsoleLog');
const GeneralData = require('../data/generalData')

module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
		if (GeneralData.logOptions.interactions) {
			const commandName = interaction.type == 'MESSAGE_COMPONENT' ? 
				interaction.customId : 
				interaction.commandName
			;

			var logMessage = '[fg=cyan]' + interaction.user.tag + 
				'[/>] in [bg=white][fg=black]#' + interaction.channel.name + 
				'[/>] triggered an interaction.\n' +
				'[fg=yellow]/[fg=green]' + commandName + '[/>]'
			;
			const options = interaction.options;
			if (options) {
				const input = interaction.options._hoistedOptions;
				const subcommand = options._subcommand ? 
				` [style=bold][style=underscore][fg=blue]${options._subcommand}[/>]` : ''
				;
				
				var commandOptions = '';
				for (let i = 0; i < input.length; i++) {
					const option = input[i];
					if (option.value) {
						commandOptions += `[fg=blue]${option.name}[/>]:[fg=cyan]${option.value}[/>] `
					}
				}
				logMessage += subcommand + '\n';
				logMessage = commandOptions != '' ? logMessage + commandOptions + '\n' : logMessage;
			}

			
			cConsole.log(logMessage, 
				{autoColorize: false}
			);
		}
	},
};
