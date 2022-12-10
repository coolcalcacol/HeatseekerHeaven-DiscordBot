const { MessageEmbed } = require('discord.js');
const cConsole = require('./customConsoleLog.js');
const generalData = require('../data/generalData.js');
const queueData = require('../data/queueData.js');
const generalUtilities = require('../utils/generalUtilities')
const playerData = require('../data/playerData');
const playerDataStorage = require('../data/database/playerDataStorage');
const QueueDatabase = require('../data/database/queueConfigStorage.js');

function queueStatusEmbed(lobby, context, interaction = null) {
    const embed = new MessageEmbed();
    const data = queueData.info.getCurrentQueue(lobby);
    const userId = interaction ? (interaction.user ? interaction.user.id : interaction.id) : null;

    var currentQueue = '';
    for (const player in data.players) {
        const user = data.players[player];
        currentQueue += '<@' + player + '> ';
    }
    
    switch (context) {
        case 'add': {
            embed.setTitle('User Joined the Queue');
            embed.setDescription('Joining User: <@' + userId + '>');
            embed.setColor('#000000');
        } break;
        case 'removed': {
            embed.setTitle('User Left the Queue');
            embed.setDescription('Leaving User: <@' + userId + '>');
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

    return embed;
}

/** 
 * @param {GameLobbyData} gameData
*/
function queueGameStartPreset(gameData, teamsOnly = false) {
    const header = new MessageEmbed()
        .setColor('#000000')
        .setTitle('Teams have been selected!')
        .setDescription([
            '__**Game ID**__:\n```js\n' + getFieldSpacing('hs' + gameData.gameId, 23) + '\n```',
            '__**Game Region**__:\n```js\n' + getFieldSpacing(gameData.region, 23) + '\n```',
        ].join('\n'))
    const teamBlue = new MessageEmbed()
        .setColor('#0000FF')
        .addFields(
            {name: 'Team Blue', value: (getTeamMembers(gameData.teams.blue) != '') ? getTeamMembers(gameData.teams.blue) : 'ERROR'}
        );
    const teamOrange = new MessageEmbed()
        .setColor('#FF9100')
        .addFields({name: 'Team Orange', value: (getTeamMembers(gameData.teams.orange) != '') ? getTeamMembers(gameData.teams.orange) : 'ERROR'});
    
    const output = !teamsOnly ? [header, teamBlue, teamOrange] : [teamBlue, teamOrange];
    return output;
}
function queueGameStartLobbyPreset(gameData = new queueData.info.GameLobbyData()) {
    const teamBlue = getTeamMembers(gameData.teams.blue);
    const teamOrange = getTeamMembers(gameData.teams.orange);
    const embed = new MessageEmbed({
        title: 'Game has started!',
        fields: [
            {name: 'Team Blue', value: teamBlue},
            {name: 'Team Orange', value: teamOrange},
        ],
        color: '#00ff00',
        timestamp: new Date().getTime()
    });
    return [embed];
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
        { name: 'Game ID', value: '```' + getFieldSpacing(gameData.gameId, 12) + '```', inline: true },
        { 
            name: 'Game Duration',
            value: '```' + getFieldSpacing(`${Math.floor(gameData.gameDuration / 1000 / 60)} min ${Math.floor((gameData.gameDuration - (Math.floor(gameData.gameDuration / 1000 / 60) * 60 * 1000)) / 1000)} sec`, 12) + '```',
            inline: true
        },
        { name: 'Winners', value: '```' + getFieldSpacing('Team ' + winningTeamName, 12) + '```', inline: true },
        // { name: 'MMR Distrebution', value: '``` Total Gained: 45 | Total Loss: 45 | Ratio: +/-0.00 ```', inline: false }
    );

    var mmrFields = [];
    for (let i = 0; i < gameResults.length; i++) {
        const result = gameResults[i];
        mmrFields.push({ name: gameResults[i][0], value: `\`\`\`js\n${getFieldSpacing(gameResults[i][1], 12)}\n\`\`\``, inline: true })
    }
    embed.addFields(mmrFields);
    embed.setFooter({text: reporter.username, iconURL: reporter.displayAvatarURL()});
    embed.setTimestamp(new Date().getTime());


    return embed;
}

function playerStatsPreset(playerData, mode = 'global') {
    const modeDisplay = 
        (mode == 'ones') ? '1v1' : 
        (mode == 'twos') ? '2v2' : 
        (mode == 'threes') ? '3v3' : 
        (mode == 'persistent') ? 'Persistent' : 
        'Global';

    const embed = new MessageEmbed();
    embed.setAuthor({name: `${playerData.userData.name} - ${modeDisplay} Stats`, iconURL: playerData.userData.avatar});
    embed.setColor(playerData.userData.displayColor);
    const bgMarker = '```';
    if (mode == 'global') {
        const rank = playerData.stats.global.rank != null ? playerData.stats.global.rank.name : 'Un-ranked';
        embed.addFields(
            { name: 'Global MMR', value: bgMarker + playerData.stats.global.mmr.toString() + bgMarker, inline: true },
            { name: 'Rank', value: bgMarker + rank + bgMarker, inline: true },
            { name: 'Win Rate', value: bgMarker + playerData.stats[mode].winRate.toString() + '%' + bgMarker, inline: true },
            { name: '1v1 MMR', value: bgMarker + 'js\n' + playerData.stats.ones.mmr.toString() + bgMarker, inline: true },
            { name: '2v2 MMR', value: bgMarker + 'js\n' + playerData.stats.twos.mmr.toString() + bgMarker, inline: true },
            { name: '3v3 MMR', value: bgMarker + 'js\n' + playerData.stats.threes.mmr.toString() + bgMarker, inline: true },
            { name: 'Games Played', value: bgMarker + playerData.stats[mode].gamesPlayed.toString() + bgMarker, inline: true },
            { name: 'Games Won', value: bgMarker + playerData.stats[mode].gamesWon.toString() + bgMarker, inline: true },
            { name: 'Games Lost', value: bgMarker + playerData.stats[mode].gamesLost.toString() + bgMarker, inline: true },
        );
    }
    else if (mode == 'persistent') {
        var timePlayed = `${Math.floor(playerData.persistentStats.timePlayed / 1000 / 60 / 60)} hours ${Math.floor((playerData.persistentStats.timePlayed - (Math.floor(playerData.persistentStats.timePlayed / 1000 / 60 / 60) * 60 * 60 * 1000)) / 1000 / 60)} min`;
        embed.addFields(
            { name: 'Average MMR', value: bgMarker + playerData.persistentStats.averageMmr.toString() + bgMarker, inline: true },
            { name: 'Time Played', value: bgMarker + timePlayed + bgMarker, inline: true },
            { name: 'Win Rate', value: bgMarker + playerData.persistentStats.winRate.toString() + '%' + bgMarker, inline: true },
            { name: 'Games Played', value: bgMarker + playerData.persistentStats.gamesPlayed.toString() + bgMarker, inline: true },
            { name: 'Games Won', value: bgMarker + playerData.persistentStats.gamesWon.toString() + bgMarker, inline: true },
            { name: 'Games Lost', value: bgMarker + playerData.persistentStats.gamesLost.toString() + bgMarker, inline: true },
        );
    }
    else {
        const rank = playerData.stats[mode].rank != null ? playerData.stats[mode].rank.name : 'Un-ranked';
        embed.addFields(
            { name: 'MMR', value: bgMarker + 'js\n' + playerData.stats[mode].mmr.toString() + bgMarker, inline: true },
            { name: 'Rank', value: bgMarker + rank + bgMarker, inline: true },
            { name: 'Win Rate', value: bgMarker + playerData.stats[mode].winRate.toString() + '%```', inline: true },
            { name: 'Games Played', value: bgMarker + playerData.stats[mode].gamesPlayed.toString() + bgMarker, inline: true },
            { name: 'Games Won', value: bgMarker + playerData.stats[mode].gamesWon.toString() + bgMarker, inline: true },
            { name: 'Games Lost', value: bgMarker + playerData.stats[mode].gamesLost.toString() + bgMarker, inline: true },
        );
    }
    // mmr: 600,
    // gamesPlayed: 0,
    // gamesWon: 0,
    // gamesLost: 0,
    // winRate: 0,
    return embed;
}

async function leaderboardPreset(page, interaction, returnMaxPage = false) {
    const playerDataList = await playerDataStorage.find({"userData.isMember": true}).sort({
        "stats.global.mmr": -1,
        "stats.global.winRate": -1,
        "stats.global.gamesPlayed": -1
    }).catch(console.error);
    var staleStart;
    var staleEnd;
    for (let i = 0; i < playerDataList.length; i++) {
        const target = playerDataList[i];
        if (!staleStart && (target.stats.global.winRate == 0 && target.stats.global.gamesPlayed == 0)) {
            staleStart = i
        }
        else if (staleStart && (target.stats.global.winRate != 0 || target.stats.global.gamesPlayed != 0)) {
            staleEnd = i;
            break
        }
    }
    
    const interactorId = interaction ? interaction.user.id : '306395424690929674';
    var targetUser = {};
    for (let i = 0; i < playerDataList.length; i++) {
        const target = playerDataList[i];
        if (target['_id'] == interactorId) {
            targetUser['data'] = target;
            let staleSubstract = (staleStart > staleEnd) ? staleStart - staleEnd : staleEnd - staleStart;
            targetUser['index'] = (i > 9 && i - staleSubstract >= 0) ? i - staleSubstract : i;
            // console.log(`index: ${i} | stale: ${staleStart} | ${staleEnd} | ${staleSubstract}`);
            break;
        }
    }
    playerDataList.splice(staleStart, (staleEnd - staleStart));

    // const queueConfig = await QueueDatabase.findOne({_id: interaction.guild.id});
    // const startingMmr = queueConfig.mmrSettings.startingMmr;  
    const topPlayerData = playerDataList[0].userData;
    const listStart = 10 * page;
    const dataList = playerDataList.splice(listStart, 10);


    var lineBreakChar = '─';
    var lineBreak = '───────────────';
    const seperator = '|'

    var nameDisplay = '';
    var statsDisplay = '';
    var totalDisplay = '';
    for (let i = 0; i <= dataList.length; i++) {
        var lb = lineBreak;
        var lbc = lineBreakChar;
        var lbName = lb + lbc + lbc;
        var player = dataList[i];
        var index = getFieldSpacing(listStart + i + 1, 3);
        if (targetUser.data && i == dataList.length) {
            player = targetUser.data;
            index = getFieldSpacing(targetUser.index + 1, 3);
            lb = '';
            lbc = '';
            lbName = '';
        }
        else if (!targetUser.data && i == dataList.length) continue;
        if (i == dataList.length - 1) {
            lb += '\n' + lb;
            lbName += '\n' + lbName;
        }
        // console.log(i + ': ' + player.userData.name)

        var userName = player.userData.mention;

        var mmr = getFieldSpacing(player.stats.global.mmr, 6);
        var gamesWon = getFieldSpacing(player.stats.global.gamesWon, 4);
        var gamesLost = getFieldSpacing(player.stats.global.gamesLost, 4);

        var gamesPlayed = getFieldSpacing(player.stats.global.gamesPlayed, 4);
        var winRate = getFieldSpacing(player.stats.global.winRate.toFixed(2) + '%', 8);

        
        nameDisplay += `\`${index}\`: ${userName}\n${lbName}\n`;
        statsDisplay += `${seperator} ${ws(2)}\`${mmr}\`${ws(3.1)}${seperator}${ws(1.12)}\`${winRate}\`${ws(1.02)} ${seperator}\n${lb}\n`;
        totalDisplay += `${seperator} ${ws(0.12)}\`${gamesPlayed}\`${ws(2.01)}${seperator}${ws(1.03)}\`${gamesWon}\`${ws(1.03)}${seperator}${ws(1.12)}\`${gamesLost}\`${ws(1.12)}${seperator}\n${lb}\n`;
        
        // statsDisplay += `${seperator} ${ws(0.1)}\`${mmr}\`${ws(3)}${seperator}${ws(1.03)}\`${gamesWon}\`${ws(1.03)}${seperator}${ws(1.12)}\`${gamesLost}\`${ws(1.11)}${seperator}\n${lb}\n`;
        // totalDisplay += `${seperator} ${ws(4)}\`${gamesPlayed}\`${ws(4.1)}${seperator}${ws(2.12)}\`${winRate}\`${ws(1.02)} ${seperator}\n${lb}\n`;
    }

    const embed = new MessageEmbed();
    try {
        embed.addFields(
            { name: `#        Player Name\n${lineBreak + lineBreakChar + lineBreakChar}`, 
                value: nameDisplay,
                inline: true 
            },
            { name: `${seperator} ${ws(3.1)}MMR${ws(5)}${seperator}${ws(2.1)}Win Rate${ws(1.12)} ${seperator}\n` + lineBreak, 
                value: statsDisplay,
                inline: true 
            },
            { name: `${seperator} ${ws(1)}Total${ws(2.02)}${seperator}${ws(1.11)}Wins${ws(2)}${seperator}${ws(2.11)}Lost${ws(2.01)} ${seperator}\n` + lineBreak, 
                value: totalDisplay,
                inline: true 
            },
            // { name: `${seperator} ${ws(0.1)}MMR${ws(2)}${seperator}${ws(1.11)}Wins${ws(2)}${seperator}${ws(2.11)}Lost${ws(2.01)} ${seperator}\n` + lineBreak, 
            //     value: statsDisplay,
            //     inline: true 
            // },
            // { name: `${seperator} ${ws(3.1)}Total${ws(5)}${seperator}${ws(3.1)}Win Rate${ws(1.2)} ${seperator}\n` + lineBreak, 
            //     value: totalDisplay,
            //     inline: true 
            // },
        );
    } catch (err) {
        console.error(err);
    }
    
    embed.setColor(topPlayerData.displayColor);
    embed.setAuthor({name: topPlayerData.name, iconURL: topPlayerData.avatar});

    if (returnMaxPage) return [[embed], Math.ceil((playerDataList.length - 1) / 10)]
    else return [embed];
}
function getFieldSpacing(value, spaces) {
    var output = '';

    // value = value.toString().replace(' ', '◘')
    
    var chars = value.toString().split('').length;
    var space = spaces - chars;
    var leftSpace = Math.ceil(space / 2);
    var rightSpace = Math.floor(space / 2);

    for (let i = 0; i < leftSpace; i++) { output += ' '; }
    output += value
    for (let i = 0; i < rightSpace; i++) { output += ' '; }

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
    queueGameStartLobbyPreset,
    reportGamePreset,
    gameResultPreset,
    playerStatsPreset,
    leaderboardPreset,
    mmrStats,
}
module.exports.methods = {
    getTeamMembers
}