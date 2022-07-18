const cConsole = require('../../utils/customConsoleLog');
const generalUtilities = require('../../utils/generalUtilities');

const mmrSystem = require('./mmrSystem');

class Game {
    constructor() {
        this.players = userList
        this.gameId = 0;
        this.teams = {
            blue: {},
            orange: {}
        }
        this.getTeams();
    }
    getTeams() {
        const generatedTeam = this.getBalancedTeams()
        this.teams.blue = new Team(generatedTeam[0]);
        this.teams.orange = new Team(generatedTeam[1]);
    }
    getBalancedTeams(size = 3) {
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
                    const valueX = teamX[i].mmr;
                    for (let k = 0; k < teamY.length; k++) {
                        const valueY = teamY[k].mmr;
                        if (valueX == valueY) {valid = false; break;}
                    }
                    if (!valid) {break;}
                }
                if (!valid) {continue;}
    
                for (let i = 0; i < teamX.length; i++) {
                    scoreX = teamX[i].mmr;
                    scoreY = teamY[i].mmr;
                }
                totalScore = (scoreX + scoreY);
                if (totalScore < bestTotalScore) {
                    bestTeams.splice(0, 1, teamX)
                    bestTeams.splice(1, 1, teamY)
                    bestTotalScore = totalScore;
                }
            }
        }
        console.log(bestTeams)
        return bestTeams;
    }
    get game() {return this;}
}
class Player {
    constructor(name) {
        this.name = name
        this.mmr = 600;
    }
    get player() {return this;}
}
class Team {
    constructor(team) {
        this.members = team;
        this.mmr = 0;
        this.validate()
    }
    validate() {
        for (const player in this.members) {
            const data = this.members[player];
            this.mmr += data.mmr;
        }
    }
    get team() {return this;}
}

const names = ['CTN', 'Josh', 'Klexic', 'Bramble', 'Lyd', 'Okey']
var userList = []
var currentGame;
var gameHistory = []

function init() {
    for (const name in names) {
        userList.push(new Player(names[name]));
    }
    simulateGame();
}
function simulateGame() {
    currentGame = new Game();
    console.log(currentGame)
    reportGame()
}
function reportGame() {
    const game = currentGame;
    const teamBlue = game.teams.blue;
    const teamOrange = game.teams.orange;
    
    const winIndex = generalUtilities.generate.getArrayElementByChance(
        [0, 1], 
        [
            (teamBlue.mmr / (teamBlue.mmr + teamOrange.mmr) * 10),
            (teamOrange.mmr / (teamOrange.mmr + teamBlue.mmr) * 10)
        ]
    );
    var loseIndex;
    if (winIndex == 1) { loseIndex = 0; } else { loseIndex = 1; }

    const winningTeam = game.teams[Object.keys(game.teams)[winIndex]];
    const losingTeam = game.teams[Object.keys(game.teams)[loseIndex]];
    calculatePlayerStats(winningTeam, losingTeam);
    gameHistory.push(game);
}
function calculatePlayerStats(winningTeam, losingTeam) {
    const combinedMmr = winningTeam.mmr + losingTeam.mmr;
    cConsole.log('--------Winners--------')
    for (const player in winningTeam.members) {
        const data = winningTeam.members[player];
        const lobbyRatio = Math.round(data.mmr / (data.mmr + combinedMmr) * 100)
        cConsole.log('Name: ' + data.name + 
            '\nRatio: ' + lobbyRatio
        );
    }
    cConsole.log('--------Losers--------')
    for (const player in losingTeam.members) {
        const data = losingTeam.members[player];
        const lobbyRatio = Math.round(data.mmr / (data.mmr + combinedMmr) * 100)
        cConsole.log(
            'Name: ' + data.name + 
            '\nRatio: ' + lobbyRatio
        );
    }
}



module.exports.methods = {
    init
}