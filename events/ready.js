const fs = require('fs');
const { cConsole, clientSendMessage, embedUtilities } = require('../utils/utilityManager.js');
const generalData = require('../data/generalData.js');
const config = require('../config/config.json');
const mmrSystem = require('../Examples/mmr/mmrSystem');
// const { databaseUtilities } = require('../utils/utilityManager');
// const { queueData } = require('../data/queue');

var count = 0;
module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		generalData.client = client;
		
		cConsole.log(`[fg=green]Ready![/>] Logged in as [style=bold][fg=cyan]${client.user.tag}[/>]`, {autoColorize: false});
		await this.runTestActions(client);
	},
	async runTestActions(client) {
		// cConsole.test();
		// embedCreator.info.test();
		// readFileTest('./');
		// console.log(count)
		// clientSendMessage.sendEmbedMessageTo(
		// 	'988155328027848736', 
		// 	embedUtilities.presets.queueGameStartPreset('ones')
		// )
		await mmrSystem.init();
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
