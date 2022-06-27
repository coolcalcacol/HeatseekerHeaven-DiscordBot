const { MessageEmbed } = require('discord.js');
const cConsole = require('./customConsoleLog.js');
const generalData = require('../data/generalData.js');
const queueData = require('../data/queue.js');


function queueStatusEmbed(lobby, context, interaction = null) {
    const embed = new MessageEmbed();
    const data = queueData.info.getCurrentQueue(lobby);

    var currentQueue = '';
    for (const player in data.players) {
        const user = data.players[player];
        currentQueue += '<@' + user.id + '> ';
    }
    
    switch (context) {
        case 'add': {
            embed.setTitle('User Joined the Queue');
            embed.setDescription('Joining User: <@' + interaction.user.id + '>');
            embed.setColor('#00FF00');
        } break;
        case 'removed': {
            embed.setTitle('User Left the Queue');
            embed.setDescription('Leaving User: <@' + interaction.user.id + '>');
            embed.setColor('#eb6e34');
        } break;
        case 'status': {
            embed.setColor('#34eb98');
        } break;
        default: break;
    }

    if (currentQueue != '') {
        embed.addField('Current Queue Size: ' + Object.keys(data.players).length , currentQueue);
    }
    else {
        embed.setFooter({text: 'Queue is Empty...'});
    }

    return [embed];
}

function queueGameStartPreset(gameData) {
    const header = new MessageEmbed()
        .setColor('#000000')
        .setTitle('Teams have been selected!')
        .setDescription('__**Match ID**__:\n```        hs' + gameData.gameId + '```')
    const teamBlue = new MessageEmbed()
        .setColor('#0000FF')
        .addFields(
            {name: 'Team Blue', value: getTeamMembers(gameData.teams.blue)}
        );
    const teamOrange = new MessageEmbed()
        .setColor('#FF9100')
        .addFields({name: 'Team Orange', value: getTeamMembers(gameData.teams.orange)});
    
    return [header, teamBlue, teamOrange]
}
function getTeamMembers(team) {
    output = '';
    for (const player in team) {
        output += '<@' + team[player] + '> '
    }
    return output;
}

function mmrStats(data) {
    const embed = new MessageEmbed();
    var description = '';

    embed.setTitle('MMR Stats');
    for (let i = 0; i < data.length; i++) {
        const target = data[i];
        description += 
            '' + target.user.mention + '\n' +
            '**MMR**: `' + target.stats.mmr + 
            '` | **Wins**: `' + target.stats.gamesWon + 
            '` | **Losses**: `' + target.stats.gamesLost + 
            '` | **Win Rate**: `' + target.stats.winRate + '%`\n\n'
        ;
    }
    embed.setDescription(description)
    return [embed]
}


module.exports.presets = {
    queueStatusEmbed,
    queueGameStartPreset,
    mmrStats
}