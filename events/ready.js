const { cConsole, clientSendMessage, embedUtilities } = require('../utils/utilityManager.js');
const generalData = require('../data/generalData.js');
const config = require('../config/config.json');
const fs = require('fs');
// const { databaseUtilities } = require('../utils/utilityManager');
// const { queueData } = require('../data/queue');

var count = 0;
module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		generalData.client = client;
		
		cConsole.log(`[fg=green]Ready![/>] Logged in as [style=bold][fg=cyan]${client.user.tag}[/>]`, {autoColorize: false});
		this.runTestActions(client);
	},
	runTestActions(client) {
		// cConsole.test();
		// embedCreator.info.test();
		// readFileTest('./');
		// console.log(count)
		// clientSendMessage.sendEmbedMessageTo(
		// 	'988155328027848736', 
		// 	embedUtilities.presets.queueGameStartPreset('ones')
		// )
	}
};

function readFileTest(dir) {
	const files = fs.readdirSync(dir);
	
	for (const file in files) {
		const target = files[file];
		if (target.endsWith('.js')) {
			console.log(target)
			count++
		}
		else if (target.match(/[a-zA-Z0-9 -]+/i) && !target.includes('.')) {
			if (target == 'node_modules') {continue}
			readFileTest(dir + '/' + target)
		}
		
	}
}
