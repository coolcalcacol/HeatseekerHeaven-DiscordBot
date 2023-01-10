const QueueConfigDatabase = require('../data/database/queueConfigStorage');
const BotConfigDatabase = require('../data/database/botConfigStorage');
const GuildDatabase = require('../data/database/guildDataStorage');

const queueSettings = require('../data/queueSettings');
const generalData = require('../data/generalData');
const queueData = require('../data/queueData');

const cConsole = require('../utils/customConsoleLog');

const botUpdate = require('./botUpdate');
const clearQueueCommand = require('../commands/debug/clearGameChannels');
const testPlayerData = require('../data/playerData');

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

		cConsole.log(`\n[fg=green]Ready![/>] Logged in as [style=bold][fg=cyan]${client.user.tag}[/>]`, { autoColorize: false });
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
				state: 'In-Game',
				details: 'Playing Ranked Heatseeker',
				timestamp: new Date().getTime(),
			}],
		});

		let botConfig = await BotConfigDatabase.findOne({});
		if (!botConfig) {
			await BotConfigDatabase.insertMany({
				_id: generalData.releasedVersion ?
					generalData.botConfig.defaultGuildId :
					generalData.botConfig.botSetupGuildId,
			});
			botConfig = await BotConfigDatabase.findOne({});
		}

		cConsole.log(`Client ID: ${client.user.id}`);
		cConsole.log(`Setting the default guild id to: [fg=green]${botConfig._id}[/>]`);
		generalData.botConfig.defaultGuildId = botConfig._id;
		const guildData = await GuildDatabase.findOne({ _id: generalData.botConfig.defaultGuildId });

		cConsole.log(`Debug mode is: ${generalData.debugMode}`);
		cConsole.log(`Released Version is: ${generalData.releasedVersion}`);
		console.log('');

		let storedQueueData = await QueueConfigDatabase.findOne({});
		if (!storedQueueData) {
			await QueueConfigDatabase.insertMany({ _id: generalData.botConfig.defaultGuildId });
			storedQueueData = await QueueConfigDatabase.findOne({});
		}
		if (storedQueueData.gameId >= 100) {
			queueData.info.globalQueueData.gameId = storedQueueData.gameId;
		}
		else {
			queueData.info.globalQueueData.gameId = 100;
			console.log('Updating GameID to 100');
			await QueueConfigDatabase.updateOne({}, { gameId: 100 }).catch(console.error);
		}


		await clearQueueCommand.execute();
		if (guildData) {
			for (const timerName in guildData.activeTimers) {
				if (timerName === 'placeholder') continue;
				const timer = guildData.activeTimers[timerName];
				botUpdate.registeredTimers.push(timer);
			}
			// console.log(botUpdate.registeredTimers);
		}
		await botUpdate.Start();
	},
	async runTestActions() {
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
				await queueData.actions.fillQueueWithPlayers(['479936093047750659'], 'threes', 1, queueSettingsData); // 888%
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
				];
				const players = {};
				for (let i = 0; i < currentGame.length; i++) {
					const id = currentGame[i];
					players[id] = await testPlayerData.getPlayerDataById(id);
				}

				const game = new queueData.info.GameLobbyData(players, 'threes', true);
				game.bypassTeamGeneration = true;
				await queueData.actions.startQueue('threes', game);
			} break;
			default: break;
			}
		}
	},
};

