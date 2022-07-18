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

    const list = sortPlayerData(data);
    embed.setTitle('MMR Stats');
    for (let i = 0; i < list.length; i++) {
        const target = list[i];
        description += 
            '' + target.user.mention + '\n' +
            '**MMR**: `' + target.stats.mmr + 
            '` | **Games**: `' + target.stats.gamesPlayed + 
            '` | **Wins**: `' + target.stats.gamesWon + 
            '` | **Losses**: `' + target.stats.gamesLost + 
            '` | **Win Rate**: `' + target.stats.winRate + '%`\n\n'
        ;
    }
    embed.setDescription(description)
    return [embed]
}

function sortPlayerData(data) {
    var output = sortDataBy(data, ['mmr', 'gamesPlayed', 'winRate'])
    var list = data;
    // for (let i = 0; i < list.length; i++) {
    //     var targetIndex = getHeighscore(list);
    //     output.push(list[targetIndex]);
    //     list.splice(targetIndex, 1);
    // }
    // if (list.length != 0) {
    //     output = output.concat(sortPlayerData(list))
    // }
    // output = output.concat(list);
    return output;
}
function sortDataBy(data, keys) {
    var output;
    output = data.sort(function(a,b) {
        var x = a['stats'][keys[0]];
        var y = b['stats'][keys[0]];
        var result = y - x;
        if (result == 0) {
            x = a['stats'][keys[1]];
            y = b['stats'][keys[1]];
            result = y - x;
            if (result == 0) {
                x = a['stats'][keys[2]];
                y = b['stats'][keys[2]];
                result = y - x;
            }
        }
        return result;
    })
    return output;
}

function getHeighscore(array) {
    var outputIndex = 0;
    for (let i = 0; i < array.length; i++) {
        const currentBest = array[outputIndex];
        const element = array[i];
        if (i == outputIndex) {continue;}
        if (element.stats.mmr > currentBest.stats.mmr) {outputIndex = i; continue;}
        else if (element.stats.mmr == currentBest.stats.mmr) {
            const targetGamesPlayed = element.stats.gamesWon + element.stats.gamesLost;
            const bestGamesPlayed = currentBest.stats.gamesWon + currentBest.stats.gamesLost;
            if (targetGamesPlayed > bestGamesPlayed) {outputIndex = i; continue;}
            else if (targetGamesPlayed == bestGamesPlayed) {
                if (element.stats.winRate > currentBest.stats.winRate) {outputIndex = i; continue;}
            }
        }
    }
    return outputIndex;
}


module.exports.presets = {
    queueStatusEmbed,
    queueGameStartPreset,
    mmrStats
}