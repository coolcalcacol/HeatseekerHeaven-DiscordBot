const generalData = require('../data/generalData');
const GuildDatabase = require('../data/database/guildDataStorage'); 

const cConsole = require('../utils/customConsoleLog');
const generalUtilities = require('../utils/generalUtilities');
const clientSend = require('../utils/clientSendMessage');

const blacklistUserCommand = require('../commands/moderation/blacklistUser');

const getGuildData = async (guildId = generalData.botConfig.defaultGuildId) => { return await GuildDatabase.findOne({_id: guildId}) }

class UpdateTimer {
    /**
     * @param {String} id The unique identifier for this timer
     * @param {Integer} time The date time in miliseconds for the timer to expire
     * @param {Function} callback The function to call when the timer expires
     * @param {Boolean} repeat Whether or not the timer should repeat
     * @param {Integer} repeatInterval The interval in miliseconds for the timer to repeat
     */
    constructor(id, time, callback, repeat = false, repeatInterval = 1000) {
        this.id = id;
        this.time = time;
        this.callback = callback;
        this.callbackString = String(callback).replace(/\w+\s{1}\w+\(\)\s?\{(\n\s+)?|\(\)\s?=>\s?{(\n\s+)?/, '').replace(/\n?\}/, '');
        this.caller = generalUtilities.generate.getCallerObject();
        this.repeat = repeat;
        this.repeatInterval = repeatInterval;
        // console.log(callbackString);
        // this.callbackString = callbackString;
        // console.log(this.callback);
        // console.log(this.caller.getFileName());
        // console.log(this.callbackString);
        this.register();
    }
    async register() {
        // var guildData = await GuildDatabase.findOne({_id: generalData.botConfig.defaultGuildId});
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
        
        // var guildData = await getGuildData();
        // if (!guildData) {
        //     await GuildDatabase.insertMany({_id: generalData.botConfig.defaultGuildId});
        //     guildData = await GuildDatabase.findOne({_id: generalData.botConfig.defaultGuildId});
        // }
        
        // guildData.activeTimers[this.id] = this;
        // // console.log(this.caller);
        // await GuildDatabase.updateOne({_id: generalData.botConfig.defaultGuildId}, guildData);
    }

    objectify(target) {
        const obj = new Object();
        for (const key in target) {
            if (target.hasOwnProperty(key)) {
                const element = target[key];
                obj[key] = element;
            }
        }
        return obj;
    }

    // get timer() { return this; }
}
const registeredTimers = [];

var uptimeTimerStarted = false;

async function Start() {
    startDefaultTimers();
    Update();
    setTimeout(UpdateSecond, 1000);
    setTimeout(UpdateMinute, 1000 * 60);
    // const testCall = test.bind(null, 'some','args','here');
    // new UpdateTimer('ready', new Date().setSeconds(new Date().getSeconds() + 10), testCall, true, 1000);
    // console.log(registeredTimers);
}

function startDefaultTimers() {
    // new UpdateTimer(
    //     'botPresenceUptimeDisplay', 
    //     new Date().setSeconds(new Date().getSeconds() + 1000 * 2), 
    //     updateBotPresence.bind(this),
    //     true,
    //     1000 * 10
    // );
    new UpdateTimer(
        'updateUserBlacklist', 
        new Date().setSeconds(new Date().getSeconds() + 2), 
        blacklistUserCommand.updateUserBlacklist.bind(blacklistUserCommand),
        true,
        1000
    );
}


function Update() {

    // setTimeout(Update, 1);
}
async function UpdateSecond() {
    // const guildData = await getGuildData();
    for (let i = 0; i < registeredTimers.length; i++) {
        const timer = registeredTimers[i];
        if (timer == 'placeholder') continue;
        if (timer.time <= new Date().getTime()) {
            try { timer.callback(); } catch (error) { console.error(error); }
            if (timer.repeat) {
                timer.time = new Date().getTime() + timer.repeatInterval;
            }
            else {
                registeredTimers.splice(i, 1);
            }
            // const dataIndex = guildData.activeTimers.indexOf(timer);
            // guildData.activeTimers.splice(dataIndex, 1);
            // if (Object.keys(guildData.activeTimers).length == 1) {
            //     guildData.activeTimers['placeholder'] = 'placeholder'; // This is to allow the database to save an empty object
            // }
            // delete guildData.activeTimers[timer.id];
            // await GuildDatabase.updateOne({_id: generalData.botConfig.defaultGuildId}, guildData);
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
    // if (!uptimeTimerStarted) return;
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
    UpdateTimer,
    registeredTimers
}