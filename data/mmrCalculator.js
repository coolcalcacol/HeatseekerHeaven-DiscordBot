const QueueData = require('../data/queueData');
const GeneralData = require('../data/generalData');
const PlayerData = require('../data/playerData');
const generalUtilities = require('../utils/generalUtilities');
const embedUtilities = require('../utils/embedUtilities');
const cConsole = require('../utils/customConsoleLog');
const clientSendMessage = require('../utils/clientSendMessage');

var debugLog = {'[fg=green]winners[/>]': {team: {}}, '[fg=red]losers[/>]': {team: {}}}

function getGameResults(winningTeam, losingTeam, gameData, equationValues) {
    const combinedMmr = winningTeam.mmr + losingTeam.mmr;
    const lobbySize = Object.keys(winningTeam.members).length + Object.keys(losingTeam.members).length
    const mode = lobbySize == 2 ? 'ones' : lobbySize == 4 ? 'twos' : lobbySize == 6 ? 'threes' : 'ERROR';
    const resultOutput = []

    debugLog.combined = combinedMmr;
    debugLog['[fg=green]winners[/>]'].team = {mmr: winningTeam.mmr};
    debugLog['[fg=red]losers[/>]'].team = {mmr: losingTeam.mmr};

    for (const player in winningTeam.members) {
        const data = winningTeam.members[player];
        
        const equation = calculatePlayerMmr(equationValues, combinedMmr, data.stats[mode], winningTeam.mmr, 'won', lobbySize);
        resultOutput.push([data.userData.nickname ? data.userData.nickname : data.userData.name, `+${equation.output}`])
        equationDebug('winners', equation, data, mode)

        data.stats[mode].mmr += Math.round(equation.output);
        data.stats[mode].gamesWon++;
        data.stats[mode].gamesPlayed++;
        
        data.stats.global.gamesWon++;
        data.stats.global.gamesPlayed++;
        data.persistentStats.gamesWon++;
        data.persistentStats.gamesPlayed++;

        updatePlayerStats(data, gameData, mode, equationValues);
    }
    for (const player in losingTeam.members) {
        const data = losingTeam.members[player];

        const equation = calculatePlayerMmr(equationValues, combinedMmr, data.stats[mode], losingTeam.mmr, 'lost', lobbySize);
        resultOutput.push([data.userData.nickname ? data.userData.nickname : data.userData.name, `-${equation.output}`])
        equationDebug('losers', equation, data, mode)

        data.stats[mode].mmr -= Math.round(equation.output);
        data.stats[mode].gamesLost++;
        data.stats[mode].gamesPlayed++;

        data.stats.global.gamesLost++;
        data.stats.global.gamesPlayed++;
        data.persistentStats.gamesLost++;
        data.persistentStats.gamesPlayed++;

        updatePlayerStats(data, gameData, mode, equationValues);
    }
    if (GeneralData.logOptions.gameMmrResults) { 
        cConsole.log(debugLog)
        debugLogContentWin = cConsole.decolorize(debugLog['[fg=green]winners[/>]']);
        debugLogContentLose = cConsole.decolorize(debugLog['[fg=red]losers[/>]']);

        clientSendMessage.sendMessageTo('945859974481985606', {
            content: '> **Winners**\n```js\n' + debugLogContentWin + '```'
        });
        clientSendMessage.sendMessageTo('945859974481985606', {
            content: '> **Losers** \n```js\n' + debugLogContentLose + '```'
        });
        debugLog = {'[fg=green]winners[/>]': {team: {}}, '[fg=red]losers[/>]': {team: {}}};
    }
    return resultOutput;
}
function calculatePlayerMmr(equationValues, combined, stats, teamMmr, gameOutcome, lobbySize) {
    const baseGain = equationValues.baseGain;
    var result = 0;
    var soloBonus = 0; // [20]
    var teamBonus = 0;
    var totalBonus = 0;

    const ratio = stats.mmr / combined;
    const teamRatio = teamMmr / combined;
    const extremeTeamRatio = Math.max(0.1, Math.min((teamRatio - 0.5) * 2 + 0.5, 0.9));
    
    var soloBonusEq = '';
    var teamBonusEq = '';
    var placementEq = '';
    const ratioDisplay = generalUtilities.generate.roundToFloat(ratio, 4);
    const teamRatioDisplay = generalUtilities.generate.roundToFloat(teamRatio, 4);
    const extremeTeamRatioDisplay = generalUtilities.generate.roundToFloat(extremeTeamRatio, 4);

    switch (gameOutcome) {
        case 'won': {
            soloBonus = (teamRatio - ratio) / teamRatio * (2 - lobbySize * 0.25);
            teamBonus = (lobbySize * baseGain) * (1 - extremeTeamRatio);
            totalBonus = lobbySize == 2 ? teamBonus : soloBonus * teamBonus;
            if (stats.mmr > equationValues.maxStart) { // Modify the bonus so the player doesnt reach >= maxCap (2500) mmr
                totalBonus -= (stats.mmr - equationValues.maxStart) * totalBonus / (equationValues.maxCap - equationValues.maxStart)
            }
            soloBonusEq = `(${teamRatioDisplay} - ${ratioDisplay}) / ${teamRatioDisplay} * (2 - ${lobbySize} * 0.25)`; // Debug Log
            teamBonusEq = `(${lobbySize} * ${baseGain}) * (1 - ${extremeTeamRatioDisplay}))`; // Debug Log
        } break;
        case 'lost': {
            soloBonus = ratio / teamRatio;
            teamBonus = (lobbySize * baseGain) * extremeTeamRatio;
            totalBonus = lobbySize == 2 ? teamBonus : soloBonus * teamBonus;
            if (stats.mmr < equationValues.minStart) { // Modify the bonus so the player doesnt reach <= minCap (0) mmr
                totalBonus -= (equationValues.minStart - stats.mmr) * totalBonus / (equationValues.minStart - equationValues.minCap)
            }
            soloBonusEq = `(${teamRatioDisplay} - ${ratioDisplay}) / ${teamRatioDisplay} * (2 - ${lobbySize} * 0.25)`; // Debug Log
            teamBonusEq = `(${lobbySize} * ${baseGain}) * ${extremeTeamRatioDisplay}`; // Debug Log
        } break;
        default: break;
    }
    result = totalBonus;
    if (equationValues.placementSettings.modeBased && stats.gamesPlayed < equationValues.placementSettings.gameCount) {
        placementEq = `${result} * (${equationValues.placementSettings.gain} - (${stats.gamesPlayed} / ${equationValues.placementSettings.gameCount}) * (${equationValues.placementSettings.gain} - 1))`;
        result = result * (equationValues.placementSettings.gain - (stats.gamesPlayed / equationValues.placementSettings.gameCount) * (equationValues.placementSettings.gain - 1));
    }
    
    // Round
        totalBonus = generalUtilities.generate.roundToFloat(totalBonus, 4);
        totalBonus = totalBonus + ` (${generalUtilities.generate.roundToFloat((soloBonus * teamBonus), 4)})`;
        soloBonus = generalUtilities.generate.roundToFloat(soloBonus, 2);
        teamBonus = generalUtilities.generate.roundToFloat(teamBonus, 2);
        result = generalUtilities.generate.roundToFloat(result, 2);
    // -

    return {
        output: result, 
        ratio: generalUtilities.generate.roundToFloat(ratio, 4), 
        teamRatio: generalUtilities.generate.roundToFloat(teamRatio, 4), 
        extremeTeamRatio: generalUtilities.generate.roundToFloat(extremeTeamRatio, 4),
        soloBonus: soloBonus, 
        teamBonus: teamBonus,
        totalBonus: totalBonus,
        soloBonusEq: soloBonusEq,
        teamBonusEq: teamBonusEq,
        placementEq: placementEq
    };
}

function updatePlayerStats(data, gameData, mode, equationValues) {
    const w = data.stats[mode].gamesWon;
    const l = data.stats[mode].gamesLost;
    const globalW = data.stats.global.gamesWon;
    const globalL = data.stats.global.gamesLost;

    data.stats[mode].winRate = generalUtilities.generate.roundToFloat((w / (w + l) * 100), 2);
    data.stats.global.winRate = generalUtilities.generate.roundToFloat((globalW / (globalW + globalL) * 100), 2);
    data.persistentStats.winRate = generalUtilities.generate.roundToFloat((data.persistentStats.gamesWon / (data.persistentStats.gamesWon + data.persistentStats.gamesLost) * 100), 2);

    data.persistentStats.timePlayed += gameData.gameDuration;

    PlayerData.updatePlayerData(data, equationValues);
}

function equationDebug(target, equation, playerData, mode) {
    const user = '"[fg=yellow]' + playerData.userData.name + '[/>]"';
    const root = target == 'winners' ? '[fg=green]' + target + '[/>]' : '[fg=red]' + target + '[/>]';

    debugLog[root].team.ratio = equation.teamRatio;
    debugLog[root].team.extremeRatio = equation.extremeTeamRatio;
    debugLog[root].team.bonus = equation.teamBonus;

    debugLog[root][user] = {};
    debugLog[root][user].mmr = playerData.stats[mode].mmr;
    debugLog[root][user].Ratio = equation.ratio;
    debugLog[root][user][[
        `[fg=blue]Solo[/>]: [fg=green]${equation.soloBonus}[/>]`,
        `[fg=blue]Total[/>]: [fg=green]${equation.totalBonus}[/>]`
    ].join(' [fg=white]|[/>] ')] = '';

    debugLog[root][user]
    [`[fg=cyan](${equation.teamBonusEq}) * (${equation.soloBonusEq})`] = '';
    if (equation.placementEq) debugLog[root][user]['placement'] = equation.placementEq;

    debugLog[root][user]['[fg=white]Result[/>]'] = equation.output;
}


module.exports = {
    getGameResults
}