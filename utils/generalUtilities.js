const generalData = require("../data/generalData")

async function getUserById(id) {
    return await generalData.client.users.fetch(id).catch(console.error);
}

function randomizeArray(array) {
    var j, x, index;
    for (index = array.length - 1; index > 0; index--) {
        j = Math.round(Math.random() * (index + 1));
        x = array[index];
        array[index] = array[j];
        array[j] = x;
    }
    return array;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports.info = {
    getUserById
}
module.exports.generate = {
    randomizeArray,
    getRandomInt
}
module.exports.actions = {
    sleep
}