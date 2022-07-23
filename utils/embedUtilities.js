const { MessageEmbed } = require('discord.js');
const cConsole = require('./customConsoleLog.js');
const generalData = require('../data/generalData.js');
const queueData = require('../data/queueData.js');
const generalUtilities = require('../utils/generalUtilities')
const playerData = require('../data/playerData');
const playerDataStorage = require('../data/database/playerDataStorage');


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

function playerStatsPreset(playerData, mode = 'global') {
    const modeDisplay = mode == 'ones' ? '1v1' : mode == 'twos' ? '2v2' : mode == 'threes' ? '3v3' : 'Global';
    const embed = new MessageEmbed();
    embed.setTitle(`${modeDisplay} Stats for ${playerData.userData.name}`);
    embed.setColor(playerData.userData.displayColor);
    const bgMarker = '```';
    if (mode == 'global') {
        embed.addFields(
            { name: 'Global MMR', value: bgMarker + playerData.stats.global.mmr.toString() + bgMarker, inline: true },
            { name: 'Rank', value: bgMarker + 'Plastic ' + generalUtilities.generate.getRandomInt(-5, 5) + bgMarker, inline: true },
            { name: 'Win Rate', value: bgMarker + playerData.stats[mode].winRate.toString() + '%' + bgMarker, inline: true },
            { name: '1v1 MMR', value: bgMarker + 'js\n' + playerData.stats.ones.mmr.toString() + bgMarker, inline: true },
            { name: '2v2 MMR', value: bgMarker + 'js\n' + playerData.stats.twos.mmr.toString() + bgMarker, inline: true },
            { name: '3v3 MMR', value: bgMarker + 'js\n' + playerData.stats.threes.mmr.toString() + bgMarker, inline: true },
            { name: 'Games Played', value: bgMarker + playerData.stats[mode].gamesPlayed.toString() + bgMarker, inline: true },
            { name: 'Games Won', value: bgMarker + playerData.stats[mode].gamesWon.toString() + bgMarker, inline: true },
            { name: 'Games Lost', value: bgMarker + playerData.stats[mode].gamesLost.toString() + bgMarker, inline: true },
        );
    }
    else {
        embed.addFields(
            { name: 'MMR', value: '```js\n' + playerData.stats[mode].mmr.toString() + '```', inline: true },
            { name: 'Rank', value: '```' + 'Plastic 5' + '```', inline: true },
            { name: 'Win Rate', value: '```' + playerData.stats[mode].winRate.toString() + '%```', inline: true },
            { name: 'Games Played', value: '```' + playerData.stats[mode].gamesPlayed.toString() + '```', inline: true },
            { name: 'Games Won', value: '```' + playerData.stats[mode].gamesWon.toString() + '```', inline: true },
            { name: 'Games Lost', value: '```' + playerData.stats[mode].gamesLost.toString() + '```', inline: true },
        );
    }
    // mmr: 600,
    // gamesPlayed: 0,
    // gamesWon: 0,
    // gamesLost: 0,
    // winRate: 0,
    return embed;
}

async function leaderboardPreset() {
    const fullDataList = await playerDataStorage.find().sort({
        "stats.global.mmr": -1, 
        "stats.global.winRate": -1, 
        "stats.global.gamesPlayed": -1
    });
    const dataList = fullDataList.splice(0, 10);

    const lineBreak = '───────────────';
    const seperator = '|'

    var nameDisplay = '';
    var statsDisplay = '';
    var totalDisplay = '';
    for (let i = 0; i < dataList.length; i++) {
        const player = dataList[i];
        var rank = getFieldSpacing(i + 1, 2);
        var userName = player.userData.mention;

        var mmr = getFieldSpacing(player.stats.global.mmr, 5);
        var gamesWon = getFieldSpacing(player.stats.global.gamesWon, 5);
        var gamesLost = getFieldSpacing(player.stats.global.gamesLost, 5);

        var gamesPlayed = getFieldSpacing(player.stats.global.gamesPlayed, 5);
        var winRate = getFieldSpacing(player.stats.global.winRate.toFixed(2) + '%', 8);

        nameDisplay += `\`${rank}\`: ${userName}\n${lineBreak}\n`;
        statsDisplay += `${seperator} ${ws(0.01)}\`${mmr}\`${ws(1)}${seperator}${ws(1.01)}\`${gamesWon}\`${ws(1.01)}${seperator}${ws(0.11)}\`${gamesLost}\` ${seperator}\n${lineBreak}\n`;
        totalDisplay += `${seperator} ${ws(3)}\`${gamesPlayed}\`${ws(3.11)}${seperator}${ws(2.12)}\`${winRate}\`${ws(1.02)} ${seperator}\n${lineBreak}\n`;
    }

    const embed = new MessageEmbed();
    embed.addFields(
        { name: '#   Player Name\n' + lineBreak, 
            value: nameDisplay,
            inline: true 
        },
        { name: `${seperator} ${ws(0.1)}MMR${ws(2)}${seperator}${ws(1.11)}Wins${ws(2)}${seperator}${ws(2.11)}Lost${ws(2.01)} ${seperator}\n` + lineBreak, 
            value: statsDisplay,
            inline: true 
        },
        { name: `${seperator} ${ws(3.1)}Total${ws(5)}${seperator}${ws(3.1)}Win Rate${ws(1.2)} ${seperator}\n` + lineBreak, 
            value: totalDisplay,
            inline: true 
        },
    );
    embed.setColor(dataList[0].userData.displayColor);
    embed.setAuthor({name: dataList[0].userData.name, iconURL: dataList[0].userData.avatar});

    return [embed];
}
function getFieldSpacing(value, spaces) {
    var output = '';

    var chars = value.toString().split('').length;
    var space = spaces - chars;
    var leftSpace = Math.ceil(space / 2);
    var rightSpace = Math.floor(space / 2);

    for (let i = 0; i < leftSpace; i++) { output += ' '; }
    output += value
    for (let i = 0; i < rightSpace; i++) { output += ' '; }

    // console.log(`${spaces} - ${chars}\n${leftSpace} | ${rightSpace}\n`);

    return output;
}

//#region Methods
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
    function ws(spaces) {
        var output = '';
        spaces = spaces.toString();
        if (!spaces.toString().includes('.')) {spaces = parseFloat(spaces + '.0').toFixed(1)}
        const full = parseInt(spaces.split('.')[0]);
        const half = parseInt(spaces.split('.')[1].split('')[0]);
        const point = parseInt(spaces.split('.')[1].split('')[1]);
        // console.log(full, half, point)
        for (let i = 0; i < full; i++) {
            output += '\u2008';
        }
        for (let i = 0; i < half; i++) {
            output += '\u00A0';
        }
        for (let i = 0; i < point; i++) {
            output += '\u200A';
        }
        return output;
    }
//#endregion

module.exports.presets = {
    queueStatusEmbed,
    queueGameStartPreset,
    reportGamePreset,
    gameResultPreset,
    playerStatsPreset,
    leaderboardPreset,
    mmrStats,
}