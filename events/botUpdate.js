const generalData = require('../data/generalData');

const cConsole = require('../utils/customConsoleLog');
const generalUtilities = require('../utils/generalUtilities');
const clientSend = require('../utils/clientSendMessage');

class UpdateTimer {
    /**
     * @param {String} id The unique identifier for this timer
     * @param {Integer} time The date time in miliseconds for the timer to expire
     * @param {Function} callback The function to call when the timer expires
     */
    constructor(id, time, callback) {
        this.id = id;
        this.time = time;
        this.callback = callback;
        this.register();
    }
    register() {
        for (let i = 0; i < registeredTimers.length; i++) {
            const timer = registeredTimers[i];
            if (this.id == timer.id) {
                timer.callback = this.callback;
                timer.time = this.time;
                // console.log(registeredTimers);
                return;
            }
        }
        // console.log(registeredTimers);
        registeredTimers.push(this);
    }
    get timer() { return this; }
}
const registeredTimers = [];
var uptimeTimerStarted = false;

function Start() {
    Update();
    setTimeout(UpdateSecond, 1000);
    setTimeout(UpdateMinute, 1000 * 60);
    // new UpdateTimer('ready', new Date().setSeconds(new Date().getSeconds() + 2), test.bind(this, 'some','args','here'))
}

function Update() {

    // setTimeout(Update, 1);
}
function UpdateSecond() {
    for (let i = 0; i < registeredTimers.length; i++) {
        const timer = registeredTimers[i];
        if (timer.time <= new Date().getTime()) {
            try { timer.callback(); } catch (error) { console.error(error); }
            registeredTimers.splice(i, 1);
        }
    }
    setTimeout(UpdateSecond, 1000);
}
function UpdateMinute() {
    if (!uptimeTimerStarted) {
        uptimeTimerStarted = true;
        updateBotPresence();
    }
    setTimeout(UpdateMinute, 1000 * 60);
}

var uptimeTimer = '0';
var uptimeSeconds = '0';
async function updateBotPresence() {
    if (!uptimeTimerStarted) return;
    // else if (uptimeTimerStarted && !forced) {
    //     uptimeSeconds = parseInt(uptimeSeconds) + 1;
    //     var secSplit = uptimeSeconds.toString().split('');
    //     if (secSplit.length != 2) uptimeSeconds = '0' + uptimeSeconds;
    //     if (uptimeSeconds.toString().split('').length != 2) uptimeSeconds = '0' + uptimeSeconds;
    // }
    // else if (forced) {
    //     uptimeTimer = generalUtilities.generate.getTimeAgo(generalData.botStats.upTime, new Date(), true, true);
    //     var timerSplit = uptimeTimer.split(':');
    //     uptimeSeconds = timerSplit[timerSplit.length - 1];

    //     uptimeTimerStarted = true;
    // }
    // var split = uptimeTimer.split(':');
    // const displayTimer = split.splice(split.length, 1).join(':') + ':' + uptimeSeconds;
    // console.log(displayTimer);

    // const time = new Date();
    // const nextUpdate = time.setSeconds(time.getSeconds() + 15);
    // new UpdateTimer('botPresenceUptimeDisplay', nextUpdate, updateBotPresence)
    
    setTimeout(updateBotPresence, 1000 * 15);
    await generalData.client.user.setPresence({
        status: 'online',
        activities: [{
            name: 'Ranked Heatseeker | ' + generalUtilities.generate.getTimeAgo(generalData.botStats.upTime, new Date(), true, true),
            type: 'PLAYING',
        }],
    });

}

function test(x, y, z) {
    console.log(`${x} | ${y} | ${z}`);
    console.log(registeredTimers);
}


module.exports = {
    Start,
    UpdateTimer
}