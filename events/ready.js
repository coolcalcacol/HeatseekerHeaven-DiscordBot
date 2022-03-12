const { cConsole, clientSendMessage, embedCreator } = require('../utilities/utilityManager.js');

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		cConsole.log(`[fg=green]Ready![/>] Logged in as [style=bold][fg=cyan]${client.user.tag}[/>]`, {autoColorize: false});
		clientSendMessage.setClient(client);
		this.runTestActuins();
	},
	runTestActuins() {
		//cConsole.test();
		embedCreator.test();
	}
};