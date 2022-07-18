const fs = require('fs');
const { cConsole, clientSendMessage, embedUtilities, generalUtilities } = require('../utils/utilityManager.js');
const generalData = require('../data/generalData.js');
const config = require('../config/config.json');
const mmrSystem = require('../Examples/mmr/mmrSystem');
const mmrCalculation = require('../Examples/mmr/mmrCalculation');
// const { databaseUtilities } = require('../utils/utilityManager');
// const { queueData } = require('../data/queue');

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
		// startCombTest()
		// return
		mmrSystem.methods.init();
		// mmrCalculation.methods.init()
	}
};

function startCombTest() {
	const array = [16, 25, 52, 43, 34, 61];
	const combos = getAllCobinations(array, 6);
	var bestTeams = [combos[0], combos[1]]
	var bestTotalScore = Math.pow(10, 8);
	for (let x = 0; x < combos.length; x++) {
		for (let y = 0; y < combos.length; y++) {
			var teamX = combos[x];
			var teamY = combos[y];
			var scoreX = 0;
			var scoreY = 0;
			var totalScore = 0;
			if (x == y) {continue;}
			
			var valid = true;
			for (let i = 0; i < teamX.length; i++) {
				const valueX = teamX[i]
				for (let k = 0; k < teamY.length; k++) {
					const valueY = teamY[k];
					if (valueX == valueY) {valid = false; break;}
				}
				if (!valid) {break;}
			}
			if (!valid) {continue;}

			for (let i = 0; i < teamX.length; i++) {
				scoreX = teamX[i];
				scoreY = teamY[i];
			}
			totalScore = (scoreX + scoreY);
			if (totalScore < bestTotalScore) {
				bestTeams.splice(0, 1, teamX)
				bestTeams.splice(1, 1, teamY)
				bestTotalScore = totalScore;
			}
		}
	}
}


function getAllCobinations(set, size) {
	// Sournce: https://gist.github.com/axelpale/3118596
	var k, i, combs, k_combs;
	combs = [];
	
	// Calculate all non-empty k-combinations
	for (k = 1; k <= set.length; k++) {
		k_combs = k_combinations(set, k);
		for (i = 0; i < k_combs.length; i++) {
			if (k_combs[i].length != size) {continue}
			combs.push(k_combs[i]);
			// console.log(k_combs[i])
		}
	}
	return combs;
}
function k_combinations(set, k) {
	// Sournce: https://gist.github.com/axelpale/3118596
	var i, j, combs, head, tailcombs;
	
	// There is no way to take e.g. sets of 5 elements from
	// a set of 4.
	if (k > set.length || k <= 0) {
		return [];
	}
	
	// K-sized set has only one K-sized subset.
	if (k == set.length) {
		return [set];
	}
	
	// There is N 1-sized subsets in a N-sized set.
	if (k == 1) {
		combs = [];
		for (i = 0; i < set.length; i++) {
			combs.push([set[i]]);
		}
		return combs;
	}
	combs = [];
	for (i = 0; i < set.length - k + 1; i++) {
		// head is a list that includes only our current element.
		head = set.slice(i, i + 1);
		// We take smaller combinations from the subsequent elements
		tailcombs = k_combinations(set.slice(i + 1), k - 1);
		// For each (k-1)-combination we join it with the current
		// and store it to the set of k-combinations.
		for (j = 0; j < tailcombs.length; j++) {
			combs.push(head.concat(tailcombs[j]));
			// console.log(head.concat(tailcombs[j]))
		}
	}
	return combs;
}

