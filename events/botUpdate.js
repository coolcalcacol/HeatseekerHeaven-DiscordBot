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
                console.log(registeredTimers);
                return;
            }
        }
        console.log(registeredTimers);
        registeredTimers.push(this);
    }
    get timer() { return this; }
}
const registeredTimers = [];


function Start() {
    Update();
    setTimeout(UpdateSecond, 1000);
    // setTimeout(UpdateMinute, 1000 * 60);
    // new UpdateTimer('ready', new Date().setSeconds(new Date().getSeconds() + 2), test.bind(this, 'some','args','here'))
}

function Update() {
    
    // setTimeout(Update, 1);
}
function UpdateSecond() {
    for (let i = 0; i < registeredTimers.length; i++) {
        const timer = registeredTimers[i];
        if (timer.time <= new Date().getTime()) {
            timer.callback();
            registeredTimers.splice(i, 1);
        }
    }
    setTimeout(UpdateSecond, 1000);
}
function UpdateMinute() {

    setTimeout(UpdateMinute, 1000 * 60);
}

function test(x, y, z) {
    console.log(`${x} | ${y} | ${z}`);
    console.log(registeredTimers);
}


module.exports = {
    Start,
    UpdateTimer
}