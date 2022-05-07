const { cConsole, clientSendMessage } = require('../utils/utilityManager.js');
const generalData = require('../data/generalData.js');
const config = require('../config/config.json');


module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		generalData.client = client;
		cConsole.log(`[fg=green]Ready![/>] Logged in as [style=bold][fg=cyan]${client.user.tag}[/>]`, {autoColorize: false});
		this.runTestActions();
	},
	runTestActions() {
		// cConsole.test();
		// embedCreator.info.test();
	}
};