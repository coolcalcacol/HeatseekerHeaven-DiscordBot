const generalData = require('./generalData');
const QueueDatabase = require('./database/queueDataStorage');
// const { embedUtilities } = require('../utils/utilityManager.js');

var queueData = {
    ones: {
        players: {},
        queueSize: 2
    },
    twos: {
        players: {},
        queueSize: 4
    },
    threes: {
        players: {},
        queueSize: 6
    },
}

async function addPlayerToQueue(interaction = null, lobby, userId = null) {
    if (!interaction && !userId) {console.log('No interaction param.'); return}
    for (const room in queueData) {
        for (const player in queueData[room]) {
            const user = queueData[room][player];
            if (userId != null) {continue;}
            if (interaction.user.id == user.id)  {
                return 'alreadyInQueue';
            }
        }
    }
    if (userId == null) {
        queueData[lobby].players[interaction.user.id] = interaction.user;
    }
    else {
        const user = await generalData.client.users.fetch(userId).catch(console.error);
        queueData[lobby].players[user.id] = user
    }

    if (Object.keys(queueData[lobby].players).length == queueData[lobby].queueSize) {
        // Start the queue
        console.log('Starting the queue for lobby: ' + lobby)
    }

    return 'enteredQueue';
}
async function fillQueueWithPlayers(players, lobby) {
    const p = shuffle(players);
    for (let i = 0; i < 6; i++) {
        await addPlayerToQueue(null, lobby, p[i].toString());
    }
}
function removePlayerFromQueue(interaction, lobby) {
    for (const player in queueData[lobby].players) {
        const user = queueData[lobby].players[player];
        if (interaction.user.id == user.id) {
            delete queueData[lobby].players[player];
            return 'removedFromQueue';
        }
    }
    return 'wasNotInQueue'
}

function getCurrentQueue(lobby = 0) {
    if (lobby != 0) {
        return queueData[lobby].players;
    }
    else {
        return queueData;
    }
}
function getCurrentQueueMessage(interaction, lobby, title = '', color) {
    if (queueData[lobby].players.length <= 0) {return;}
    const currentQueueData = queueData[lobby].players;
    var currentQueue = '';
    for (const player in queueData[lobby].players) {
        const user = queueData[lobby].players[player];
        currentQueue += '<@' + user.id + '> ';
    }
    if (currentQueue == '') {
        return 'Queue is empty...'
    }
    else {
        return "[embedUtilities.presets.queueStatusEmbed(lobby, 'currentQueue')]"
        // return '__**Current Queue**__\nSize: ' + 
        // Object.keys(queueData[lobby].players).length + 
        // '\nUsers in Queue: ' + currentQueue;
    }
}
function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.round(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

module.exports.actions = {
    addPlayerToQueue,
    fillQueueWithPlayers,
    removePlayerFromQueue
}
module.exports.info = {
    getCurrentQueue,
    getCurrentQueueMessage
}