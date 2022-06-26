const { cConsole } = require('../utils/utilityManager.js');

module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
		cConsole.log(
			'[fg=cyan]' + interaction.user.tag + 
			'[/>] in [style=inverse][fg=black]#' + interaction.channel.name + 
			'[/>] triggered an interaction.\n' +
			'[fg=yellow]/[fg=green]' + interaction.commandName + '[/>]\n', 
			{autoColorize: false}
		);
	},
};
