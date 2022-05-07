const { cConsole } = require('../utils/utilityManager.js');

module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
		cConsole.log(
			`[fg=cyan]${interaction.user.tag}[/>] in [style=inverse]#${interaction.channel.name}[/>] triggered an interaction.\n[fg=cyan]${interaction}[/>]\n`, 
			{autoColorize: false}
		);
	},
};
