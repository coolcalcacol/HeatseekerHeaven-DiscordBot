const { MessageEmbed } = require('discord.js');
const cConsole = require('./customConsoleLog.js');
const generalData = require('../data/generalData.js');
const queueData = require('../data/queueData.js');


function queueStatusEmbed(lobby, context, interaction = null) {
    const embed = new MessageEmbed();
    const data = queueData.info.getCurrentQueue(lobby);

    var currentQueue = '';
    for (const player in data.players) {
        const user = data.players[player];
        currentQueue += '<@' + player + '> ';
    }
    
    switch (context) {
        case 'add': {
            embed.setTitle('User Joined the Queue');
            embed.setDescription('Joining User: <@' + interaction.user.id + '>');
            embed.setColor('#000000');
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
    for (const playerData in team.members) {
        // console.log('getting team member: ' + team.members[playerData]);
        // output += team.members[playerData].userData.mention;
        output += `<@${team.members[playerData]._id}> `
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

function reportGamePreset(gameData) {
    const date = new Date();
    const embed = new MessageEmbed();
    embed.setTitle('Report Game');
    embed.setDescription('Report the outcome of the game');
    embed.setColor('#0000ff');
    embed.addFields(
        { name: 'Game ID', value: gameData.gameId.toString(), inline: true },
        { 
            name: 'Game Type', 
            value: gameData.lobby == 'ones' ? '1v1' : gameData.lobby == 'twos' ? '2v2' : gameData.lobby == 'threes' ? '3v3' : 'ERROR',
            inline: true
        }
    );
    // embed.addField('Game ID', gameData.gameId, true);
    // embed.addField('Game Duration', '8 Min | 24 sec', true);

    var teamBlueDisplay = [];
    var teamOrangeDisplay = [];
    for (const playerData in gameData.teams.blue.members) {
        const player = gameData.teams.blue.members[playerData];
        teamBlueDisplay.push(player.userData.mention.replace('-', ''));
    }
    for (const playerData in gameData.teams.orange.members) {
        const player = gameData.teams.orange.members[playerData];
        teamOrangeDisplay.push(player.userData.mention.replace('-', ''));
    }
    teamBlueDisplay = teamBlueDisplay.join(' ')
    teamOrangeDisplay = teamOrangeDisplay.join(' ')

    embed.addField('Team Blue', teamBlueDisplay);
    embed.addField('Team Orange', teamOrangeDisplay);

    embed.setFooter({text: 'Select the outcome for the team you were a part of'})
    
    return embed;
}

function gameResultPreset(gameData, gameResults, reporter, winningTeamName) {
    const embed = new MessageEmbed();

    embed.setTitle('Game Results');
    embed.setColor('#00ff00');
    embed.addFields(
        { name: 'Game ID', value: '```' + gameData.gameId.toString() + '```', inline: true },
        { 
            name: 'Reported By', 
            value: '```' + reporter + '```',
            inline: true
        },
        { name: 'Winners', value: '```Team ' + winningTeamName + '```', inline: true },
        // { name: 'MMR Distrebution', value: '``` Total Gained: 45 | Total Loss: 45 | Ratio: +/-0.00 ```', inline: false }
    );

    var mmrFields = [];
    for (let i = 0; i < gameResults.length; i++) {
        const result = gameResults[i];
        mmrFields.push({ name: gameResults[i][0], value: gameResults[i][1], inline: true })
    }
    embed.addFields(mmrFields);


    return embed;
}
function playerStatsPreset(playerData) {
    const embed = new MessageEmbed();
    embed.setTitle('Stats for ' + playerData.userData.name);
    embed.setColor('#00FFFF');
    embed.addFields(
        { name: 'MMR', value: '```' + playerData.stats.mmr.toString() + '```', inline: true },
        { name: 'Rank', value: '```' + 'Plastic 5' + '```', inline: true },
        { name: 'Win Rate', value: '```' + playerData.stats.winRate.toString() + '%```', inline: true },
        { name: 'Games Played', value: '```' + playerData.stats.gamesPlayed.toString() + '```', inline: true },
        { name: 'Games Won', value: '```' + playerData.stats.gamesWon.toString() + '```', inline: true },
        { name: 'Games Lost', value: '```' + playerData.stats.gamesLost.toString() + '```', inline: true },
    );
    // mmr: 600,
    // gamesPlayed: 0,
    // gamesWon: 0,
    // gamesLost: 0,
    // winRate: 0,
    return embed;
}


module.exports.presets = {
    queueStatusEmbed,
    queueGameStartPreset,
    reportGamePreset,
    gameResultPreset,
    playerStatsPreset,
    mmrStats,
}