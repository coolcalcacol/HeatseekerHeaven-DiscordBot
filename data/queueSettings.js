const QueueDatabase = require('./database/queueConfigStorage');
const generalData = require('./generalData.js');
const generalUtilities = require('../utils/generalUtilities');
const cConsole = require('../utils/customConsoleLog.js');


async function createQueueDatabase(data) {
    thisLog('Creating new Queuedatabase Object')
    var newData = new QueueDatabase();
    newData = comparedDataObject(newData, data, newData.schema.obj);
    newData['_id'] = data['_id'];

    thisLog('create data with id: ' + data['_id']);
    const insertedData = await QueueDatabase.insertMany(newData)
        .catch(console.error)
    ;

    thisLog('Inserted newly created data');
    thisLog(insertedData._doc);
    
    return newData;
}
async function updateQueueDatabase(update, createIfNull = true, compare = true) {
    const guildId = update['_id'];
    thisLog('\nStarting to update Object by id: ' + guildId)
    var target = await QueueDatabase.findOne({_id: guildId})
        .catch(console.error);
    if (target) {
        thisLog('Found target to update');
        thisLog(target['_doc']);

        thisLog('Starting to compare data and updating it');
        const comparedData = compare ? comparedDataObject(target, update, target.schema.obj) : update;
        comparedData['_id'] = target['_id'];
        comparedData['__v'] = target['__v'] + 1;
        const updateData = await QueueDatabase.updateOne({_id: guildId}, comparedData).catch(console.error);

        thisLog('Updated the compared data');
        thisLog(updateData);
    }
    else if (createIfNull) {
        thisLog(
            'Did not find target data by id: ' + guildId + 
            '\nCreating new Data Object'
        );
        return await createQueueDatabase(update)
            .catch(console.error);
    }
}

function comparedDataObject(target, data, keys) {
    for (const key in keys) {
        if (data[key] != null) {
            if (typeof target[key] == "object") {
                target[key] = comparedDataObject(target[key], data[key], keys[key]);
            }
            else {
                if (key != 'type' && key != 'default') {
                    target[key] = data[key];
                }
            }
        }
    }
    return target;
}

//#region Getters
    async function getQueueDatabaseById(guildId, createIfNull = true) {
        const target = await QueueDatabase.findOne({_id: guildId}).catch(console.error);
        
        if (target) { 
            thisLog(`Found QueueSettings by guild id: ${guildId}`);
            thisLog(target['_doc']);
            return target; 
        }
        else if (createIfNull) {
            var output = await createQueueDatabase({_id: guildId});
            output['_id'] = guildId;
            return output;
        }
    }

    async function getRankedLobbyById(id, guildId) {
        var output = '';

        var queueData = await QueueDatabase.findOne({_id: guildId});
        thisLog(queueData);
        if (queueData == null) {
            thisLog('ERROR: QueueData is not defined\nat: queueDatabaseUtilities.js:12')
            return;
        }
        var channelData = queueData.channelSettings;

        for (const channel in channelData) {
            if (id == channelData[channel]) {
                output = channel.replace('Channel', '');
                break;
            }
        }

        return output;
    }
    async function getRankedLobbyByName(lobby, guildId) {
        var output = '';

        var queueData = await QueueDatabase.findOne({_id: guildId});
        if (queueData == null) {
            thisLog('ERROR: QueueData is not defined')
            return;
        }
        var channelData = queueData.channelSettings;

        for (const channel in channelData) {
            if (lobby == channel.replace('Channel', '')) {
                output = channelData[channel];
                break;
            }
        }

        return output;
    }
//#endregion


function thisLog(log) {
    if (!generalData.logOptions.queueSettings) return;
    if (typeof log == "object") {
        console.log(log);
        console.log('');
    }
    else {
        cConsole.log('[fg=green]QDBS[/>]: ' + log)
    }
}

module.exports = {
    createQueueDatabase,
    updateQueueDatabase,
    getQueueDatabaseById,
    getRankedLobbyById,
    getRankedLobbyByName,
}