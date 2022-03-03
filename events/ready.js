const cConsole = require('../utilities/customConsoleLog.js');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		cConsole.log(`[fg=green]Ready![/>] Logged in as [style=bold][fg=cyan]${client.user.tag}[/>]`, {autoColorize: false});
		//cConsole.test();
	},
};