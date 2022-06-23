const cConsole = require('./customConsoleLog.js');
const generalData = require('../data/generalData.js');
const QueueDatabase = require('../data/database/queueDataStorage');


async function getRankedLobby(id) {
    var output = '';

    var query = QueueDatabase.find({});
    var queueData = (await query.select())[0];
    if (queueData == null) { 
        cConsole.log('ERROR: QueueData is not defined\nat: databaseUtilities.js:12')
        return
    }
    var channelData = queueData.channelSettings;

    for (const channel in channelData) {
        if (id == channelData[channel]) {
            output = channel.replace('Channel', '');
        }
    }

    return output;
}

module.exports = {
    getRankedLobby
}