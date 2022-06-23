const { MessageEmbed } = require('discord.js');
const cConsole = require('./customConsoleLog.js');
const generalData = require('../data/generalData.js');
const queueData = require('../data/queue.js');


function queueStatusEmbed(lobby, title = 'Queue Status', color = '#00FF00') {
    const data = queueData.info.getCurrentQueue();
    var currentQueue = '';
    for (const player in data[lobby].players) {
        const user = data[lobby].players[player];
        currentQueue += '<@' + user.id + '> ';
    }
    if (currentQueue == '') {currentQueue = 'Queue is empty...'}
    const embed = new MessageEmbed()
        .setColor(color)
        .setTitle(title)
        .setDescription('Current Queue Size: **' + Object.keys(data[lobby].players).length + '**')
        .addField('Current Queue', currentQueue);
    return [embed];
}

function queueGameStartPreset(lobby) {
    const header = new MessageEmbed() 
        .setColor('#000000')
        .setTitle('Teams have been selected!')
        .setDescription('__**Match ID**__:\n```        12345```')
    const teamBlue = new MessageEmbed()
        .setColor('#0000FF')
        .addFields({name: 'Team Blue', value: '<@306395424690929674>'});
    const teamOrange = new MessageEmbed()
        .setColor('#FF9100')
        .addFields({name: 'Team Orange', value: '<@479936093047750659>'});
    
    return [header, teamBlue, teamOrange]
}


module.exports.presets = {
    queueStatusEmbed,
    queueGameStartPreset
}