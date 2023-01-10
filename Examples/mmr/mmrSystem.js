const generalUtilities = require('../../utils/generalUtilities');
const queueData = require('../../data/queueData').info.globalQueueData;

const userList = [];

class GameLobby {
	constructor(players, lobby) {
		this.lobby = lobby;
		this.players = [];
		for (const p in players) { this.players.push(players[p]); }
		this.teams = {
			blue: {},
			orange: {},
		};
		this.gameId = queueData.getGameID();
		this.getTeams();
	}
	getTeams() {
		switch (this.lobby) {
		case 'ones':{
			this.teams.blue = new TeamData([this.players[0]]);
			this.teams.orange = new TeamData([this.players[1]]);
		} break;
		case 'twos':{
			const generatedTeams = this.getBalancedTeams(2);
			this.teams.blue = new TeamData(generatedTeams[0]);
			this.teams.orange = new TeamData(generatedTeams[1]);
		} break;
		case 'threes':{
			const generatedTeams = this.getBalancedTeams(3);
			this.teams.blue = new TeamData(generatedTeams[0]);
			this.teams.orange = new TeamData(generatedTeams[1]);
		} break;

		default: break;
		}
		// console.log(this.teams);
	}
	getBalancedTeams(size) {
		const array = this.players;
		const combos = generalUtilities.generate.getAllCombinations(array, size);
		let bestTeams = [combos[0], combos[1]];
		let bestTotalScore = Math.pow(10, 8);
		for (let x = 0; x < combos.length; x++) {
			for (let y = 0; y < combos.length; y++) {
				const teamX = combos[x];
				const teamY = combos[y];
				let scoreX = 0;
				let scoreY = 0;
				let totalScore = 0;
				if (x === y) {continue;}

				let valid = true;
				for (let i = 0; i < teamX.length; i++) {
					for (let k = 0; k < teamY.length; k++) {
						if (teamX.includes(teamY[k])) {
							valid = false;
							break;
						}
					}
					if (!valid) {break;}
				}
				if (!valid) {continue;}

				for (let i = 0; i < teamX.length; i++) {
					scoreX += teamX[i].stats.mmr;
					scoreY += teamY[i].stats.mmr;
				}
				totalScore = Math.abs(scoreX - scoreY);
				if (totalScore < bestTotalScore) {
					// bestTeams.splice(0, 1, teamX);
					// bestTeams.splice(1, 1, teamY);
					bestTeams = [teamX, teamY];
					bestTotalScore = totalScore;
				}
			}
		}
		return bestTeams;
	}
	get game() {
		return this;
	}
}
class TeamData {
	constructor(team) {
		this.members = team;
		this.mmr = 0;
		this.validate();
	}
	validate() {
		for (const player in this.members) {
			const data = this.members[player];
			this.mmr += data.stats.mmr;
		}
	}
}
class PlayerData {
	constructor(data) {
		this.data = data;
		this.user = {
			name: '',
			id: '',
			mention: '',
		};
		this.stats = {
			mmr: 600,
			gamesPlayed: 0,
			gamesWon: 0,
			gamesLost: 0,
			winRate: 0,
		};
		this.formatData();
	}
	formatData() {
		this.user.id = this.data.id;
		this.user.name = this.data.username;
		this.user.mention = '<@' + this.user.id + '>';
	}
	get playerData() {
		return this;
	}
}

module.exports.info = {
	GameLobby,
	TeamData,
	PlayerData,
	userList,
};
