const mongoose = require('mongoose');

const PlayerDataSchema = new mongoose.Schema({
	_id: String,
	userData: {
		name: String,
		nickname: String,
		mention: String,
		discriminator: String,
		roles: Array,
		displayColor: String,
		avatar: String,
		createdAt: Date,
		joinedAt: Date,
		isMember: { type: Boolean, default: true },
	},
	stats: {
		global: {
			mmr: { type: Number, default: 600 },
			gamesPlayed: { type: Number, default: 0 },
			gamesWon: { type: Number, default: 0 },
			gamesLost: { type: Number, default: 0 },
			winRate: { type: Number, default: 0 },
			rank: { type: Object, default: null },
		},
		ones: {
			mmr: { type: Number, default: 600 },
			gamesPlayed: { type: Number, default: 0 },
			gamesWon: { type: Number, default: 0 },
			gamesLost: { type: Number, default: 0 },
			winRate: { type: Number, default: 0 },
			rank: { type: Object, default: null },
		},
		twos: {
			mmr: { type: Number, default: 600 },
			gamesPlayed: { type: Number, default: 0 },
			gamesWon: { type: Number, default: 0 },
			gamesLost: { type: Number, default: 0 },
			winRate: { type: Number, default: 0 },
			rank: { type: Object, default: null },
		},
		threes: {
			mmr: { type: Number, default: 600 },
			gamesPlayed: { type: Number, default: 0 },
			gamesWon: { type: Number, default: 0 },
			gamesLost: { type: Number, default: 0 },
			winRate: { type: Number, default: 0 },
			rank: { type: Object, default: null },
		},
	},
	persistentStats: {
		averageMmr: { type: Number, default: 0 },
		totalMmr: { type: Number, default: 0 }, // to calculate average, not displayed
		timePlayed: { type: Number, default: 0 },
		winRate: { type: Number, default: 0 },
		gamesPlayed: { type: Number, default: 0 },
		gamesWon: { type: Number, default: 0 },
		gamesLost: { type: Number, default: 0 },
	},
}, { timestamps: true });

module.exports = mongoose.model('PlayerDatabase', PlayerDataSchema);


// class PlayerData {
//     constructor(data) {
//         this.userData = data;
//         this.user = {
//             name: '',
//             id: '',
//             mention: '',
//         }
//         this.stats = {
//             mmr: 600,
//             gamesPlayed: 0,
//             gamesWon: 0,
//             gamesLost: 0,
//             winRate: 0,
//         }
//         this.formatData();
//     }
//     formatData() {
//         this.user.id = this.userData.id;
//         this.user.name = this.userData.username;
//         this.user.mention = '<@' + this.user.id + '>';
//     }
//     calculateStats() {
//         const w = this.stats.gamesWon;
//         const l = this.stats.gamesLost;
//         this.stats.gamesPlayed = w + l;
//         this.stats.winRate = generalUtilities.generate.roundToFloat((w / (w + l) * 100), 2);
//     }
//     get playerData() {
//         return this;
//     }
// }