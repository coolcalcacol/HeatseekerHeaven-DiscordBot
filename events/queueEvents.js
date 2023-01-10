const cConsole = require('../utils/customConsoleLog');
const generalUtilities = require('../utils/generalUtilities');

module.exports = {
	name: 'queueEvent',
	async execute(interaction, action, lobby = '0v0') {
		const userData = interaction.user ? interaction.user : await generalUtilities.info.getUserById(interaction.id);
		let context;
		switch (action) {
		case 'add': { context = `has been [fg=green]added[/>] to the [fg=magenta]${lobby}[/>] queue`; } break;
		case 'removed': { context = `has been [fg=red]removed[/>] from the [fg=magenta]${lobby}[/>] queue`; } break;
		default: break;
		}
		cConsole.log(
			'-------- [fg=green]Queue Event[/>]--------\n' +
            '[style=bold][fg=cyan]' + userData.tag + '[/>] ' + context + '\n',
			{ autoColorize: false },
		);
	},
};
