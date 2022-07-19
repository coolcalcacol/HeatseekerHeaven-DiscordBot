const clientSendMessage = require('../../utils/clientSendMessage');
const cConsole = require('../../utils/customConsoleLog');
const generalUtilities = require('../../utils/generalUtilities');
const embedUtilities = require('../../utils/embedUtilities');
const queueData = require('../../data/queue').info.queueData;


const userWhitelist = [
    '479936093047750659', // 888%
    '280432147695665163', // Joshh
    '599339755662082057', // Darn
    '688819598686289952', // Lxyer
    '287657356312051724', // yur
    '399024946631802891', // Wesh
    '138115007983517697', // klex
    '295244765547462656', // Acc70
    '614257446654967813', // orangecod
    // '465960027400830980', // Stockfish 13
    '267442458638417921', // NoLimitGoten
    '371465297477238784', // lydipai
    '437259152574906368', // SuperSpaceMonke
    '492497679570436117', // CSmith_Games
    '95630080893521920',  // kaelan
    '568449733228756993', // Bramble
    '382279435828723716', // FinnayBusiness
]

const userList = []

class GameLobby {
    constructor(players, lobby) {
        this.lobby = lobby;
        this.players = [];
        for (const p in players) { this.players.push(players[p]); }
        this.teams = {
            blue: {},
            orange: {}
        }
        this.gameId = queueData.getGameID();
        this.getTeams();
    }
    getTeams() {
        switch (this.lobby) {
            case 'ones':{
                this.teams.blue = new TeamData([this.players[0]]);
                this.teams.orange = new TeamData([this.players[1]]);
            } break;
            case 'twos':{
                const generatedTeams = this.getBalancedTeams(2)
                this.teams.blue = new TeamData(generatedTeams[0]);
                this.teams.orange = new TeamData(generatedTeams[1]);
            } break;
            case 'threes':{
                const generatedTeams = this.getBalancedTeams(3)
                this.teams.blue = new TeamData(generatedTeams[0]);
                this.teams.orange = new TeamData(generatedTeams[1]);
            } break;
        
            default: break;
        }
        // console.log(this.teams);
    }
    getBalancedTeams(size) {
        const array = this.players;
        const combos = generalUtilities.generate.getAllCobinations(array, size);
        var bestTeams = [combos[0], combos[1]]
        var bestTotalScore = Math.pow(10, 8);
        for (let x = 0; x < combos.length; x++) {
            for (let y = 0; y < combos.length; y++) {
                var teamX = combos[x];
                var teamY = combos[y];
                var scoreX = 0;
                var scoreY = 0;
                var totalScore = 0;
                if (x == y) {continue;}
                
                var valid = true;
                for (let i = 0; i < teamX.length; i++) {
                    for (let k = 0; k < teamY.length; k++) {
                        if (teamX.includes(teamY[k])) {
                            valid = false;
                            break;
                        }
                    }
                    if (!valid) {break;}
                }
                if (!valid) {continue;}
    
                for (let i = 0; i < teamX.length; i++) {
                    scoreX += teamX[i].stats.mmr;
                    scoreY += teamY[i].stats.mmr;
                }
                totalScore = Math.abs(scoreX - scoreY);
                if (totalScore < bestTotalScore) {
                    // bestTeams.splice(0, 1, teamX);
                    // bestTeams.splice(1, 1, teamY);
                    bestTeams = [teamX, teamY];
                    bestTotalScore = totalScore;
                }
            }
        }
        return bestTeams;
    }
    get game() {
        return this;
    }
}
class TeamData {
    constructor(team) {
        this.members = team;
        this.mmr = 0;
        this.validate()
    }
    validate() {
        for (const player in this.members) {
            const data = this.members[player];
            this.mmr += data.stats.mmr;
        }
    }
}
class PlayerData {
    constructor(data) {
        this.data = data;
        this.user = {
            name: '',
            id: '',
            mention: '',
        }
        this.stats = {
            mmr: 600,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            winRate: 0,
        }
        this.formatData();
    }
    formatData() {
        this.user.id = this.data.id;
        this.user.name = this.data.username;
        this.user.mention = '<@' + this.user.id + '>';
    }
    calculateStats() {
        const w = this.stats.gamesWon;
        const l = this.stats.gamesLost;
        this.stats.gamesPlayed = w + l;
        this.stats.winRate = generalUtilities.generate.roundToFloat((w / (w + l) * 100), 2);
    }
    get playerData() {
        return this;
    }
}

var playerDataList = [];
var gameInProgress;
var debugLog = {'[fg=green]winners[/>]': {team: {}}, '[fg=red]losers[/>]': {team: {}}}

const simCount = 10000;
const interval = 10001;
const logSpecificCount = []

const restInterval = 1000;
var incriment = interval;
var restIncriment = restInterval;

var count = 0;
async function init() {
    if (userList.length == 0) { await getUserList(); }
    count++;
    generateGame();
    DebugConsole();
    if (count == incriment) {
        incriment += interval;
    }
    if (count == restIncriment) {
        restIncriment += restInterval;
        await generalUtilities.actions.sleep(generalUtilities.generate.roundToFloat(simCount * 0.0001, 2))
    }
    if (count >= simCount) {
        await clientSendMessage.editMessage(
            '990755902279798844',
            '990756029279129650', 
            {embeds: embedUtilities.presets.mmrStats(playerDataList)}
        )
        cConsole.log('Simulation Finished...');
        return;
    }
    init();
}
function generateGame() {
    const p = generalUtilities.generate.randomizeArray(userList);
    var queue = [];
    for (let i = 0; i < 6; i++) {
        const user = p[i];
        try {
            var playerData = getPlayerDataById(user.id);
        } catch(error) {
            console.log(error)
            return;
        }

        if (playerData == null) {
            const newData = new PlayerData(user)
            playerDataList.push(newData);
            playerData = newData;
        }
        queue.push(playerData);
    }
    gameInProgress = new GameLobby(queue, 'threes');
    reportGame();
}
function reportGame() {
    const game = gameInProgress;
    const teamBlue = game.teams.blue;
    const teamOrange = game.teams.orange;
    var blueOdds = teamBlue.mmr / (teamBlue.mmr + teamOrange.mmr) * 10;
    var orangeOdds = teamOrange.mmr / (teamOrange.mmr + teamBlue.mmr12) * 10;

    // if (blueOdds > orangeOdds) {blueOdds *= 2}
    // else {orangeOdds *= 2}
    
    const winIndex = generalUtilities.generate.getArrayElementByChance(
        [0, 1], [blueOdds, orangeOdds]
    );
    var loseIndex;
    if (winIndex == 1) { loseIndex = 0; } else { loseIndex = 1; }

    const winningTeam = game.teams[Object.keys(game.teams)[winIndex]];
    const losingTeam = game.teams[Object.keys(game.teams)[loseIndex]];
    calculatePlayerStats(winningTeam, losingTeam);
}

function calculatePlayerStats(winningTeam, losingTeam) {
    const combinedMmr = winningTeam.mmr + losingTeam.mmr;

    debugLog.combined = combinedMmr;
    debugLog['[fg=green]winners[/>]'].team = {mmr: winningTeam.mmr};
    debugLog['[fg=red]losers[/>]'].team = {mmr: losingTeam.mmr};

    for (const player in winningTeam.members) {
        const data = winningTeam.members[player];
        
        const equation = calculatePlayerMmr(combinedMmr, data.stats, winningTeam.mmr, 'won');
        equationDebug('winners', equation, data)

        data.stats.mmr += Math.round(equation.output);
        data.stats.gamesWon++;

        data.calculateStats();
    }
    for (const player in losingTeam.members) {
        const data = losingTeam.members[player];

        const equation = calculatePlayerMmr(combinedMmr, data.stats, losingTeam.mmr, 'lost');
        equationDebug('losers', equation, data)

        data.stats.mmr -= Math.round(equation.output);
        data.stats.gamesLost++;

        data.calculateStats();
    }
}
function calculatePlayerMmr(combined, stats, teamMmr, gameOutcome) {

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
    const ratioDisplay = generalUtilities.generate.roundToFloat(ratio, 4);
    const teamRatioDisplay = generalUtilities.generate.roundToFloat(teamRatio, 4);
    const extremeTeamRatioDisplay = generalUtilities.generate.roundToFloat(extremeTeamRatio, 4);
    
    

    switch (gameOutcome) {
        case 'won': {
            soloBonus = (teamRatio - ratio) / teamRatio * 0.5;
            teamBonus = (6 * baseGain) * (1 - extremeTeamRatio);
            totalBonus = soloBonus * teamBonus;
            if (stats.mmr > 1500) { // Modify the bonus so the player doesnt reach >= 2500 mmr
                totalBonus -= (stats.mmr - 1500) * totalBonus / 1000
            }
            soloBonusEq = `(${ratioDisplay} - ${ratioDisplay}) / ${teamRatioDisplay} * 0.5`; // Debug Log
            teamBonusEq = `(6 * ${baseGain}) * (1 - ${extremeTeamRatioDisplay}))`; // Debug Log
        } break;
        case 'lost': {
            soloBonus = (teamRatio - ratio) / teamRatio * 0.5;
            teamBonus = (6 * baseGain) * extremeTeamRatio;
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
        teamBonusEq: teamBonusEq
    };
}
function equationDebug(target, equation, userData) {
    const user = '[fg=yellow]' + userData.user.name + '[/>]';
    const root = target == 'winners' ? '[fg=green]' + target + '[/>]' : '[fg=red]' + target + '[/>]';

    debugLog[root].team.ratio = equation.teamRatio;
    debugLog[root].team.extremeRatio = equation.extremeTeamRatio;
    debugLog[root].team.bonus = equation.teamBonus;

    debugLog[root][user] = {};
    debugLog[root][user].mmr = userData.stats.mmr;
    debugLog[root][user].Ratio = equation.ratio;
    debugLog[root][user][[
        `[fg=blue]Solo[/>]: [fg=green]${equation.soloBonus}[/>]`,
        `[fg=blue]Total[/>]: [fg=green]${equation.totalBonus}[/>]`
    ].join(' [fg=white]|[/>] ')] = '';

    debugLog[root][user]
    [`[fg=cyan](${equation.teamBonusEq}) * (${equation.soloBonusEq})`] = '';

    debugLog[root][user]['[fg=white]Result[/>]'] = equation.output;
}
function DebugConsole() {
    var bypass = ConsoleOverwrite();
    if (bypass || count == incriment || count >= simCount || logSpecificCount.includes(count)) {
        cConsole.log('Simulation loop: ' + count + '/' + simCount)
        cConsole.log(debugLog);
    }
    debugLog = {'[fg=green]winners[/>]': {team: {}}, '[fg=red]losers[/>]': {team: {}}};
}
function ConsoleOverwrite() {
    const data = debugLog;
    const winners = data['[fg=green]winners[/>]'];
    const losers = data['[fg=red]losers[/>]'];
    const winningTeam = winners.team;
    const losingTeam = losers.team;

    // if ((losingTeam.mmr - winningTeam.mmr) > 1000) {
    //     debugLog = 
    //     {[`[bg=white][fg=black]BYPASS: Losers mmr < winners | [${losingTeam.mmr - winningTeam.mmr}]`]: debugLog}
    //     return true;
    // }
    if ((winningTeam.mmr) > 5000) {
        debugLog = 
        {[`[bg=white][fg=black]BYPASS: Winners mmr > 4500 | [${winningTeam.mmr}]`]: debugLog[winners]}
        return true;
    }
    if ((losingTeam.mmr) < 500) {
        debugLog = 
        {[`[bg=white][fg=black]BYPASS: Winners mmr > 4500 | [${losingTeam.mmr}]`]: debugLog[losers]}
        return true;
    }
    return false;
}

function getPlayerDataById(id) {
    for (const data in playerDataList) {
        if (playerDataList[data].user.id == id) {
            return playerDataList[data];
        }
    }
    return null;
}
async function getUserList() {
    for (const id in userWhitelist) {
        userList.push(await generalUtilities.info.getUserById(userWhitelist[id]))
    }
}

module.exports.methods = {
    init,
    getUserList
}
module.exports.info = {
    GameLobby,
    TeamData,
    PlayerData,
    userList
}