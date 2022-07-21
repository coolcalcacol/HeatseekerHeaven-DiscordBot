const cConsole = require('../utils/customConsoleLog');
const GeneralData = require('../data/generalData')

module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
		if (GeneralData.logOptions.interactions) {
			const commandName = interaction.type == 'MESSAGE_COMPONENT' ? interaction.customId : interaction.commandName;
			cConsole.log(
				'[fg=cyan]' + interaction.user.tag + 
				'[/>] in [style=inverse][fg=black]#' + interaction.channel.name + 
				'[/>] triggered an interaction.\n' +
				'[fg=yellow]/[fg=green]' + commandName + '[/>]\n', 
				{autoColorize: false}
			);
		}
	},
};
