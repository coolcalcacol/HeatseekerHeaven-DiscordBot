const mongoose = require('mongoose');

const PlayerDataSchema = new mongoose.Schema({
    _id: String,
    userData: {
        type: Object, 
        required: true
    },
    stats: {
        mmr: Number,
        gamesPlayed: Number,
        gamesWon: Number,
        gamesLost: Number,
        winRate: Number,
    }
}, {timestamps: true});

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