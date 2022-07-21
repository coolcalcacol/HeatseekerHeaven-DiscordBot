const QueueData = require('../data/queueData');
const GeneralData = require('../data/generalData');
const PlayerData = require('../data/playerData');
const GeneralUtilities = require('../utils/GeneralUtilities');
const EmbedUtilities = require('../utils/embedUtilities');
const cConsole = require('../utils/customConsoleLog');


var debugLog = {'[fg=green]winners[/>]': {team: {}}, '[fg=red]losers[/>]': {team: {}}}

function getGameResults(winningTeam, losingTeam) {
    const combinedMmr = winningTeam.mmr + losingTeam.mmr;
    const lobbySize = Object.keys(winningTeam.members).length + Object.keys(losingTeam.members).length
    const resultOutput = []

    debugLog.combined = combinedMmr;
    debugLog['[fg=green]winners[/>]'].team = {mmr: winningTeam.mmr};
    debugLog['[fg=red]losers[/>]'].team = {mmr: losingTeam.mmr};

    for (const player in winningTeam.members) {
        const data = winningTeam.members[player];
        
        const equation = calculatePlayerMmr(combinedMmr, data.stats, winningTeam.mmr, 'won', lobbySize);
        resultOutput.push([data.userData.name, `+${equation.output}`])
        equationDebug('winners', equation, data)

        data.stats.mmr += Math.round(equation.output);
        data.stats.gamesWon++;

        updatePlayerStats(data);
    }
    for (const player in losingTeam.members) {
        const data = losingTeam.members[player];

        const equation = calculatePlayerMmr(combinedMmr, data.stats, losingTeam.mmr, 'lost', lobbySize);
        resultOutput.push([data.userData.name, `-${equation.output}`])
        equationDebug('losers', equation, data)

        data.stats.mmr -= Math.round(equation.output);
        data.stats.gamesLost++;

        updatePlayerStats(data);
    }
    if (GeneralData.logOptions.gameMmrResults) { cConsole.log(debugLog); }
    return resultOutput;
}
function calculatePlayerMmr(combined, stats, teamMmr, gameOutcome, lobbySize) {

    const baseGain = 15;
    var result = 0;
    var soloBonus = 0; // [20]
    var teamBonus = 0;
    var totalBonus = 0;

    const ratio = stats.mmr / combined;
    const teamRatio = teamMmr / combined;
    const extremeTeamRatio = Math.max(0.1, Math.min((teamRatio - 0.5) * 2 + 0.5, 0.9));
    
    var soloBonusEq;
    var teamBonusEq;
    const ratioDisplay = GeneralUtilities.generate.roundToFloat(ratio, 4);
    const teamRatioDisplay = GeneralUtilities.generate.roundToFloat(teamRatio, 4);
    const extremeTeamRatioDisplay = GeneralUtilities.generate.roundToFloat(extremeTeamRatio, 4);

    switch (gameOutcome) {
        case 'won': {
            soloBonus = (teamRatio - ratio) / teamRatio * 0.5;
            teamBonus = (lobbySize * baseGain) * (1 - extremeTeamRatio);
            totalBonus = soloBonus * teamBonus;
            if (stats.mmr > 1500) { // Modify the bonus so the player doesnt reach >= 2500 mmr
                totalBonus -= (stats.mmr - 1500) * totalBonus / 1000
            }
            soloBonusEq = `(${ratioDisplay} - ${ratioDisplay}) / ${teamRatioDisplay} * 0.5`; // Debug Log
            teamBonusEq = `(6 * ${baseGain}) * (1 - ${extremeTeamRatioDisplay}))`; // Debug Log
        } break;
        case 'lost': {
            soloBonus = (teamRatio - ratio) / teamRatio * 0.5;
            teamBonus = (lobbySize * baseGain) * extremeTeamRatio;
            totalBonus = soloBonus * teamBonus;
            if (stats.mmr < 100) { // Modify the bonus so the player doesnt reach <= 0 mmr
                totalBonus -= (100 - stats.mmr) * totalBonus / 100
            }
            soloBonusEq = `${ratioDisplay} / ${teamRatioDisplay}`; // Debug Log
            teamBonusEq = `(6 * ${baseGain}) * ${extremeTeamRatioDisplay}`; // Debug Log
        } break;
        default: break;
    }
    result = totalBonus;
    
    // Round
        totalBonus = GeneralUtilities.generate.roundToFloat(totalBonus, 4);
        totalBonus = totalBonus + ` (${GeneralUtilities.generate.roundToFloat((soloBonus * teamBonus), 4)})`;
        soloBonus = GeneralUtilities.generate.roundToFloat(soloBonus, 2);
        teamBonus = GeneralUtilities.generate.roundToFloat(teamBonus, 2);
        result = GeneralUtilities.generate.roundToFloat(result, 2);
    // -

    return {
        output: result, 
        ratio: GeneralUtilities.generate.roundToFloat(ratio, 4), 
        teamRatio: GeneralUtilities.generate.roundToFloat(teamRatio, 4), 
        extremeTeamRatio: GeneralUtilities.generate.roundToFloat(extremeTeamRatio, 4),
        soloBonus: soloBonus, 
        teamBonus: teamBonus,
        totalBonus: totalBonus,
        soloBonusEq: soloBonusEq,
        teamBonusEq: teamBonusEq
    };
}

function updatePlayerStats(data) {
    const w = data.stats.gamesWon;
    const l = data.stats.gamesLost;
    data.stats.gamesPlayed = w + l;
    data.stats.winRate = GeneralUtilities.generate.roundToFloat((w / (w + l) * 100), 2);

    PlayerData.updatePlayerData(data);
}

function equationDebug(target, equation, playerData) {
    const user = '[fg=yellow]' + playerData.userData.name + '[/>]';
    const root = target == 'winners' ? '[fg=green]' + target + '[/>]' : '[fg=red]' + target + '[/>]';

    debugLog[root].team.ratio = equation.teamRatio;
    debugLog[root].team.extremeRatio = equation.extremeTeamRatio;
    debugLog[root].team.bonus = equation.teamBonus;

    debugLog[root][user] = {};
    debugLog[root][user].mmr = playerData.stats.mmr;
    debugLog[root][user].Ratio = equation.ratio;
    debugLog[root][user][[
        `[fg=blue]Solo[/>]: [fg=green]${equation.soloBonus}[/>]`,
        `[fg=blue]Total[/>]: [fg=green]${equation.totalBonus}[/>]`
    ].join(' [fg=white]|[/>] ')] = '';

    debugLog[root][user]
    [`[fg=cyan](${equation.teamBonusEq}) * (${equation.soloBonusEq})`] = '';

    debugLog[root][user]['[fg=white]Result[/>]'] = equation.output;
}


module.exports = {
    getGameResults
}