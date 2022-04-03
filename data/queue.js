const { cConsole, clientSendMessage, embedCreator } = require('../utilities/utilityManager.js');

var queueData = {
    ones: {},
    twos: {},
    threes: {}
}

function addPlayerToQueue(interaction, lobby) {
    for (const player in queueData[lobby]) {
        const user = queueData[lobby][player];
        if (interaction.user.id == user.id)  {
            return 'alreadyInQueue';
        }
    }
    queueData[lobby][interaction.user.id] = interaction.user;
    return 'enteredQueue';
}
function removePlayerFromQueue(interaction, lobby) {
    for (const player in queueData[lobby]) {
        const user = queueData[lobby][player];
        if (interaction.user.id == user.id) {
            delete queueData[lobby][player];
            return 'removedFromQueue';
        }
    }
    return 'wasNotInQueue'
}

function getCurrentQueue(lobby = 0) {
    if (lobby != 0) {
        return queueData[lobby];
    }
    else {
        return queueData;
    }
}
function getCurrentQueueMessage(interaction, lobby) {
    if (queueData[lobby].length <= 0) {return;}
    const currentQueueData = queueData[lobby];
    var currentQueue = '';
    for (const player in queueData[lobby]) {
        const user = queueData[lobby][player];
        currentQueue += '<@' + user.id + '>' + ', ';
    }
    if (currentQueue == '') {
        return 'Queue is empty...'
    }
    else {
        return '__**CurrentQueue**__\n' + currentQueue;
    }
}

module.exports.actions = {
    addPlayerToQueue,
    removePlayerFromQueue
}
module.exports.info = {
    getCurrentQueue,
    getCurrentQueueMessage
}