const { Presence, PermissionOverwrites } = require('discord.js');

const QueueConfigDatabase = require('../data/database/queueConfigStorage');
const PlayerDatabase = require('../data/database/playerDataStorage');
const BotConfigDatabase = require('../data/database/botConfigStorage');
const GuildDatabase = require('../data/database/guildDataStorage');

const queueSettings = require('../data/queueSettings');
const generalData = require('../data/generalData');
const playerData = require('../data/playerData');
const queueData = require('../data/queueData');

const cConsole = require('../utils/customConsoleLog');
const embedUtilities = require('../utils/embedUtilities');
const generalUtilities = require('../utils/generalUtilities');
const clientSend = require('../utils/clientSendMessage');

const botUpdate = require('./botUpdate');
const clearQueueCommand = require('../commands/debug/clearGameChannels');
const teamSelectionButtons = require('../commands/MessageActions/buttons/teamSelectionButtons');

const sleep = require('node:timers/promises').setTimeout;
// const config = require('../config/config.json');
// const mmrSystem = require('../examples/mmr/mmrSystem');
// const mmrCalculation = require('../Examples/mmr/mmrCalculation');

const userWhitelist = generalData.userWhitelist;

module.exports = {
	name: 'ready',
	once: true,
	queueConfig: null,
	async execute(client) {
		generalData.client = client;
		
		cConsole.log(`\n[fg=green]Ready![/>] Logged in as [style=bold][fg=cyan]${client.user.tag}[/>]`, {autoColorize: false});
		await this.Awake(client);
		await this.runTestActions(client);
	},
	async Awake(client) {
		generalData.botStats.upTime = new Date();
		
		client.user.setPresence({
			status: 'online',
			activities: [{
				name: 'HELLO WORLD',
				type: 'PLAYING',
				state: "In-Game",
				details: "Playing Ranked Heatseeker",
				timestamp: new Date().getTime(),
			}],
		});

		var botConfig = await BotConfigDatabase.findOne({});
		if (!botConfig) {
			await BotConfigDatabase.insertMany({
				_id: generalData.releasedVersion ? 
					generalData.botConfig.defaultGuildId : 
					generalData.botConfig.botSetupGuildId
			});
			botConfig = await BotConfigDatabase.findOne({});
		}

		cConsole.log(`Client ID: ${client.user.id}`);
		cConsole.log(`Setting the default guild id to: [fg=green]${botConfig._id}[/>]`);
		generalData.botConfig.defaultGuildId = botConfig._id;
		const guildData = await GuildDatabase.findOne({_id: generalData.botConfig.defaultGuildId});

		cConsole.log(`Debug mode is: ${generalData.debugMode}`);
		cConsole.log(`Released Version is: ${generalData.releasedVersion}`);
		console.log('');

		var storedQueueData = await QueueConfigDatabase.findOne({});
		if (!storedQueueData) {
			await QueueConfigDatabase.insertMany({_id: generalData.botConfig.defaultGuildId});
			storedQueueData = await QueueConfigDatabase.findOne({});
		}
		if (storedQueueData.gameId >= 100) {
			queueData.info.globalQueueData.gameId = storedQueueData.gameId;
		}
		else {
			queueData.info.globalQueueData.gameId = 100;
			console.log('Updating GameID to 100');
			await QueueConfigDatabase.updateOne({}, {gameId: 100}).catch(console.error);
		}


		clearQueueCommand.execute();
		if (guildData) {
			for (const timerName in guildData.activeTimers) {
				if (timerName == 'placeholder') continue;
				const timer = guildData.activeTimers[timerName];
				botUpdate.registeredTimers.push(timer);
			}
			// console.log(botUpdate.registeredTimers);
		}
		botUpdate.Start();
	},
	async runTestActions(client) {
		if (generalData.debugOptions.createGameOnStart) {
			const queueSettingsData = await queueSettings.getQueueDatabaseById(generalData.botConfig.defaultGuildId).catch(console.error);
			switch (generalData.debugOptions.gameOnStartLobby) {
				case 'ones': {
					await queueData.actions.fillQueueWithPlayers(['306395424690929674'], 'ones', 1, queueSettingsData); // CTN
					// await queueData.actions.fillQueueWithPlayers(userWhitelist, 'ones', 1, queueSettingsData);
					await queueData.actions.fillQueueWithPlayers(['479936093047750659'], 'ones', 1, queueSettingsData); // 888%
					// await queueData.actions.fillQueueWithPlayers(userWhitelist, 'ones', 1, queueSettingsData);
					// await queueData.actions.fillQueueWithPlayers(['988513771452526623'], 'ones', 1, queueSettingsData); // CTN-Originals
					// await queueData.actions.fillQueueWithPlayers(['382279435828723716'], 'ones', 1, queueSettingsData);
					// await queueData.actions.fillQueueWithPlayers(['653453312271581205'], 'ones', 1, queueSettingsData);
				} break;
				case 'twos': {
					// await queueData.actions.fillQueueWithPlayers(userWhitelist, 'twos', 2, queueSettingsData);
					await queueData.actions.fillQueueWithPlayers(['306395424690929674'], 'twos', 1, queueSettingsData); // CTN
					await queueData.actions.fillQueueWithPlayers(['479936093047750659'], 'twos', 1, queueSettingsData); // 888%
					await queueData.actions.fillQueueWithPlayers(['138115007983517697'], 'twos', 1, queueSettingsData); // Klexic
					await queueData.actions.fillQueueWithPlayers(['988513771452526623'], 'twos', 1, queueSettingsData); // CTN-Originals
					// await queueData.actions.fillQueueWithPlayers(['382279435828723716'], 'twos', 1, queueSettingsData);
				} break;
				case 'threes': {
					await queueData.actions.fillQueueWithPlayers(['306395424690929674'], 'threes', 1, queueSettingsData); // CTN
					await queueData.actions.fillQueueWithPlayers(userWhitelist, 'threes', 4, queueSettingsData);
					await queueData.actions.fillQueueWithPlayers(['479936093047750659'], 'threes', 1, queueSettingsData); //888%
					// await queueData.actions.fillQueueWithPlayers(['88109760729088000'], 'threes', 1, queueSettingsData);
					// await queueData.actions.fillQueueWithPlayers(['382279435828723716'], 'threes', 1, queueSettingsData);
					// await queueData.actions.fillQueueWithPlayers(['362052637400498187'], 'threes', 1, queueSettingsData);
				} break;
				case 'custom': {
					const currentGame = [
						'399024946631802891', // Wesh
						'457617584033103892', // Orcas
						'138115007983517697', // klex
						'568449733228756993', // Bramble
						'201039454930993152', // MarshMallow
						'198802539783651328', // tavz
					]
					var players = {};
					for (let i = 0; i < currentGame.length; i++) {
						const id = currentGame[i];
						const pData = await testPlayerData.getPlayerDataById(id);
						players[id] = pData;
					}

					const game = new queueData.info.GameLobbyData(players, 'threes', true);
					game.bypassTeamGenerati
					on = true;
					queueData.actions.startQueue('threes', game);
				} break;
				default: break;
			}
		}

		// await this.getGameRegion({EU: 3, USE: 3, USW: 0, MENA: 0});
		// await this.getGameRegion({EU: 3, USE: 1, USW: 1, MENA: 1});
		// await this.getGameRegion({EU: 2, USE: 2, USW: 0, MENA: 2});
		// await this.getGameRegion({EU: 3, USE: 1, USW: 2, MENA: 0});
		// await this.getGameRegion({EU: 1, USE: 1, USW: 2, MENA: 2});
		// await this.getGameRegion({EU: 0, USE: 0, USW: 3, MENA: 3});
		// await this.getGameRegion({EU: 3, USE: 0, USW: 0, MENA: 3});

		// await this.getGameRegion({EU: 4, USE: 2, USW: 0, MENA: 0});
		// await this.getGameRegion({EU: 2, USE: 4, USW: 0, MENA: 0});
		// await this.getGameRegion({EU: 2, USE: 3, USW: 0, MENA: 1});
		// await this.getGameRegion({EU: 2, USE: 3, USW: 0, MENA: 0, OCE: 1});
		// await this.getGameRegion({EU: 2, USE: 2, USW: 0, MENA: 0, OCE: 2});
		// await this.getGameRegion({EU: 0, USE: 0, USW: 0, MENA: 3, OCE: 3});
				
		// // let result = 50;
		// const equationValues = {
		// 	placementGain: 4,
		// 	placementGames: 10,
		// }
		// const testPlacementEquation = (result, gamesPlayed) => {
		// 	result = result * (
		// 	    equationValues.placementGain - 
		// 	    ((gamesPlayed / equationValues.placementGames) * (equationValues.placementGain - 1))
		// 	);
		// 	return result;
		// }
		

		// console.log(testPlacementEquation(50, 0));
		// console.log(testPlacementEquation(50, 1));
		// console.log(testPlacementEquation(50, 2));
		// console.log(testPlacementEquation(50, 3));
		// console.log(testPlacementEquation(50, 4));
		// console.log(testPlacementEquation(50, 5));
		// console.log(testPlacementEquation(50, 6));
		// console.log(testPlacementEquation(50, 7));
		// console.log(testPlacementEquation(50, 8));
		// console.log(testPlacementEquation(50, 9));
		// console.log(testPlacementEquation(50, 10));

		

		// const caller = generalUtilities.generate.getCaller();
		// console.log(`${caller} - Test Actions Complete`);

		// const testPlayerData = [
		// 	await playerData.getPlayerDataById('479936093047750659'),
		// 	await playerData.getPlayerDataById('306395424690929674')
		// ]
		// clientSend.sendMessageTo('945859974481985606', '`---- Before ----`')
		// for (let p = 0; p < testPlayerData.length; p++) {
		// 	const player = testPlayerData[p];
		// 	clientSend.sendMessageTo('945859974481985606', [
		// 		`\`${player.userData.name.split('')[0]}\`  =  Total: ${player.stats['ones'].gamesPlayed} \`|\``,
		// 		` Won: ${player.stats['ones'].gamesWon} \`|\``,
		// 		` Lost: ${player.stats['ones'].gamesLost}`
		// 	].join(''));
		// }
		
		// clientSend.sendMessageTo('988155328027848736', {embeds: [
		// 	embedUtilities.presets.playerStatsPreset(await playerData.getPlayerDataById('479936093047750659'), 'ones'),
		// 	embedUtilities.presets.playerStatsPreset(await playerData.getPlayerDataById('306395424690929674'), 'ones')
		// ]})

		// const guild = await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
		// const vc = await guild.channels.cache.get('1013063161982758972'); // 999776641163202701
		// vc.permissionOverwrites.edit(await generalUtilities.info.getUserById('306395424690929674'), {VIEW_CHANNEL: true});
		// const perms = await vc.permissionOverwrites.cache.get('306395424690929674');
		// perms.delete('Testing sus');
		
		// vc.permissionOverwrites.set([{
		// 	id: '306395424690929674',
		// 	allow: ['VIEW_CHANNEL']
		// }])
		// vc.permissionOverwrites.cache = perms;
		// console.log(perms)
		// var target = vc.get();
		// console.log(vc.get('1013063161982758972'))
		// vc.forEach(v => {
		// 	target = v;
		// });

		// const time = new Date()
		// const startTime = new Date(2022, 7, 13, 14, 8, 44);
		// console.log(generalUtilities.generate.getTimeAgo(startTime, time, true, true))

		// const diffInMs = new Date(time) - new Date(startTime);
		// const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
		// const hours = Math.floor(diffInMs / (1000 * 60 * 60) - (24 * days));
		// const minutes = Math.floor(diffInMs / (1000 * 60) - (days * 24 * 60) - (hours * 60));
		// const seconds = Math.floor(diffInMs / (1000) - (days*24*60*60)-(hours*60*60)-(minutes*60));
		// console.log(time);
		// console.log(startTime);
		// console.log('')
		// console.log(diffInMs);
		// console.log('days: ' + days);
		// console.log('hours: ' + hours);
		// console.log('minutes: ' + minutes);
		// console.log('seconds: ' + seconds);

		// playerData.updatePlayerRanks('811667577985302528');
		
		// const data = await PlayerDatabase.find();
		// const v = await QueueConfigDatabase.findOne({_id: '811667577985302528'});
		// for (let i = 0; i < data.length; i++) {
		// 	const player = data[i];
		// 	playerData.updatePlayerData(player, v.mmrSettings);
		// }

		// var data = {
		// 	_id: '811667577985302528',
		// 	mmrSettings: {
		// 		startingMmr: 500,
		// 		baseGain: 50,
		// 	}
		// }
		// await queueSettings.updateQueueDatabase(data, false);

		// cConsole.test();
		// embedCreator.info.test();
		// startCombTest()
		// mmrSystem.methods.init();
		// mmrCalculation.methods.init()
		
		// clientSend.sendMessageTo('945703058657120266', {embeds: await embedUtilities.presets.leaderboardPreset(0)})
		// clientSend.editMessage(
		// 	'945703058657120266', 
		// 	'1002252270458654860', 
		// 	{ embeds: await embedUtilities.presets.leaderboardPreset(0) }
		// );

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
	},

	// async returnPromise() {
	// 	return new Promise(resolve => {

	// 	})
	// }

	// Region selection Test
		// async getGameRegion(testCase) {
		// 	if (!this.queueConfig) { this.queueConfig = await QueueConfigDatabase.findOne({_id: '811667577985302528'}); }
		// 	// Get the queue configuration and the region roles
		// 	const regionRoles = this.queueConfig.roleSettings.regionRoles;

		// 	const regionCounts = {};
		// 	for (const regionIndex in regionRoles) {
		// 		const targetRegion = regionRoles[regionIndex];
		// 		const caseRegion = testCase[targetRegion.region];
		// 		if (caseRegion == null) { continue; }
		// 		regionCounts[targetRegion.region] = {
		// 			count: caseRegion,
		// 			neighbors: 0,
		// 			multiplier: (targetRegion.tieBreaker) ? 0.75 : 0.5,
		// 			score: (targetRegion.tieBreaker) ? 1 : 0
		// 		};
		// 	}

		// 	for (const region in regionCounts) {
		// 		const targetRegion = regionRoles.find(x => x.region == region);
		// 		if (!targetRegion) { continue; }

		// 		// console.log(targetRegion)
		// 		for (const neighbor of targetRegion.neighbors) {
		// 			if (regionCounts[neighbor]) {
        //                 regionCounts[neighbor].neighbors += regionCounts[region].count;
		// 			}
		// 		}
		// 		if (targetRegion.preferredRegion) {
		// 			regionCounts[targetRegion.preferredRegion].multiplier += (regionCounts[region].count * 0.1875);
		// 		}
		// 	}

		// 	// Initialize counters for each region
		// 	for (const region in regionCounts) {
        //         const regionScore = regionCounts[region];
        //         regionScore.score = regionScore.count + (regionScore.neighbors * regionScore.multiplier);
        //     }

		// 	// Find the region with the most players
		// 	let bestRegion = null;
		// 	let bestScore = 0;
		// 	for (const [region, {score}] of Object.entries(regionCounts)) {
		// 		if (!bestRegion) {
		// 			bestRegion = region;
		// 			bestScore = score;
		// 			continue;
		// 		}
		// 		if (score > bestScore) {
		// 			bestRegion = region;
		// 			bestScore = score;
		// 		}
		// 		else if (score == bestScore) {
		// 			let rng = generalUtilities.generate.getRandomInt(0, 1);
		// 			let otherRegion = (rng > 0) ? region : bestRegion;
		// 			bestRegion = (rng == 0) ? region : bestRegion;

		// 			cConsole.log(`[fg=yellow]Randomly selected[/>] [fg=green]${bestRegion}[/>] [fg=cyan]over[/>] [fg=red]${otherRegion}[/>]: ${rng}`);
		// 		}
		// 	}

		// 	cConsole.log(JSON.stringify(testCase).replaceAll('"', '').replaceAll('{', '').replaceAll('}', '').replaceAll(':', ': ').replaceAll(',', ' '))
		// 	cConsole.log(`[fg=green]Chosen Region[/>]: ${bestRegion} | ${bestScore}`); // Debugging line to check the region with the most players
		// 	console.log(regionCounts); // Debugging line to check the region counts
		// 	console.log(' ')
		// }
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

