const cConsole = require('../utilities/customConsoleLog.js');

module.exports = {
	name: 'interactionCreate',
	execute(interaction) {
		cConsole.log(`[fg=cyan]${interaction.user.tag}[/>] in [style=inverse]#${interaction.channel.name}[/>] triggered an interaction.\n[fg=cyan]${interaction}[/>]`, {autoColorize: false});
	},
};
