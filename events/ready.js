const fs = require('fs');
const cConsole = require('../utils/customConsoleLog');
const EmbedUtilities = require('../utils/embedUtilities');
const ClientSend = require('../utils/clientSendMessage');
const GeneralData = require('../data/generalData');
const PlayerData = require('../data/playerData');
const QueueData = require('../data/queueData');
const sleep = require('node:timers/promises').setTimeout;
// const config = require('../config/config.json');
// const mmrSystem = require('../examples/mmr/mmrSystem');
// const mmrCalculation = require('../Examples/mmr/mmrCalculation');
// const { databaseUtilities } = require('../utils/utilityManager');


const userWhitelist = [
    '479936093047750659', // 888%
    '280432147695665163', // Joshh
    '599339755662082057', // Darn
    '688819598686289952', // Lxyer
    '287657356312051724', // yur
    '399024946631802891', // Wesh
    '138115007983517697', // klex
    '295244765547462656', // Acc70
    '614257446654967813', // orangecod
    '465960027400830980', // Stockfish 13
    '267442458638417921', // NoLimitGoten
    '371465297477238784', // lydipai
    '437259152574906368', // SuperSpaceMonke
    '492497679570436117', // CSmith_Games
    '95630080893521920',  // kaelan
    '568449733228756993', // Bramble
    '382279435828723716', // FinnayBusiness
    '178625919559270409', // ncj
]

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
		GeneralData.client = client;
		
		cConsole.log(`[fg=green]Ready![/>] Logged in as [style=bold][fg=cyan]${client.user.tag}[/>]`, {autoColorize: false});
		await this.runTestActions(client);
	},
	async runTestActions(client) {

		// await QueueData.actions.fillQueueWithPlayers(userWhitelist, 'threes', 5);
		// await sleep(1000);
		// await QueueData.actions.fillQueueWithPlayers(['306395424690929674'], 'threes', 1);

		// cConsole.test();
		// embedCreator.info.test();
		// startCombTest()
		// return
		// mmrSystem.methods.init();
		// mmrCalculation.methods.init()
		// clientSend.editMessage('945703058657120266', '999310605859180584', {embeds: [embedUtilities.presets.reportGamePreset()]});

		// const x = 'ones';
		// const y = 'twos';
		// const z = 'threes';
		// const o = '';
		// // Conditional (ternary) operator
		// const xo = x == 'ones' ? '1v1' : x == 'twos' ? '2v2' : x == 'threes' ? '3v3' : 'ERROR';
		// const yo = y == 'ones' ? '1v1' : y == 'twos' ? '2v2' : y == 'threes' ? '3v3' : 'ERROR';
		// const zo = z == 'ones' ? '1v1' : z == 'twos' ? '2v2' : z == 'threes' ? '3v3' : 'ERROR';
		// const oo = o == 'ones' ? '1v1' : o == 'twos' ? '2v2' : o == 'threes' ? '3v3' : 'ERROR';
		// console.log(`${xo} ${yo} ${zo} ${oo}`)
	}
};

// function startCombTest() {
// 	const array = [16, 25, 52, 43, 34, 61];
// 	const combos = getAllCobinations(array, 6);
// 	var bestTeams = [combos[0], combos[1]]
// 	var bestTotalScore = Math.pow(10, 8);
// 	for (let x = 0; x < combos.length; x++) {
// 		for (let y = 0; y < combos.length; y++) {
// 			var teamX = combos[x];
// 			var teamY = combos[y];
// 			var scoreX = 0;
// 			var scoreY = 0;
// 			var totalScore = 0;
// 			if (x == y) {continue;}
			
// 			var valid = true;
// 			for (let i = 0; i < teamX.length; i++) {
// 				const valueX = teamX[i]
// 				for (let k = 0; k < teamY.length; k++) {
// 					const valueY = teamY[k];
// 					if (valueX == valueY) {valid = false; break;}
// 				}
// 				if (!valid) {break;}
// 			}
// 			if (!valid) {continue;}

// 			for (let i = 0; i < teamX.length; i++) {
// 				scoreX = teamX[i];
// 				scoreY = teamY[i];
// 			}
// 			totalScore = (scoreX + scoreY);
// 			if (totalScore < bestTotalScore) {
// 				bestTeams.splice(0, 1, teamX)
// 				bestTeams.splice(1, 1, teamY)
// 				bestTotalScore = totalScore;
// 			}
// 		}
// 	}
// }


// function getAllCobinations(set, size) {
// 	// Sournce: https://gist.github.com/axelpale/3118596
// 	var k, i, combs, k_combs;
// 	combs = [];
	
// 	// Calculate all non-empty k-combinations
// 	for (k = 1; k <= set.length; k++) {
// 		k_combs = k_combinations(set, k);
// 		for (i = 0; i < k_combs.length; i++) {
// 			if (k_combs[i].length != size) {continue}
// 			combs.push(k_combs[i]);
// 			// console.log(k_combs[i])
// 		}
// 	}
// 	return combs;
// }
// function k_combinations(set, k) {
// 	// Sournce: https://gist.github.com/axelpale/3118596
// 	var i, j, combs, head, tailcombs;
	
// 	// There is no way to take e.g. sets of 5 elements from
// 	// a set of 4.
// 	if (k > set.length || k <= 0) {
// 		return [];
// 	}
	
// 	// K-sized set has only one K-sized subset.
// 	if (k == set.length) {
// 		return [set];
// 	}
	
// 	// There is N 1-sized subsets in a N-sized set.
// 	if (k == 1) {
// 		combs = [];
// 		for (i = 0; i < set.length; i++) {
// 			combs.push([set[i]]);
// 		}
// 		return combs;
// 	}
// 	combs = [];
// 	for (i = 0; i < set.length - k + 1; i++) {
// 		// head is a list that includes only our current element.
// 		head = set.slice(i, i + 1);
// 		// We take smaller combinations from the subsequent elements
// 		tailcombs = k_combinations(set.slice(i + 1), k - 1);
// 		// For each (k-1)-combination we join it with the current
// 		// and store it to the set of k-combinations.
// 		for (j = 0; j < tailcombs.length; j++) {
// 			combs.push(head.concat(tailcombs[j]));
// 			// console.log(head.concat(tailcombs[j]))
// 		}
// 	}
// 	return combs;
// }

