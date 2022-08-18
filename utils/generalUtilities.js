const generalData = require("../data/generalData");
const config = require('../config/config.json');
const cConsole = require('./customConsoleLog');

async function getUserById(id) {
    return await generalData.client.users.fetch(id).catch(console.error);
}
async function getMemberById(id) {
	const guild = await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
	var output;
    try { 
		output = await guild.members.fetch(id);
	} catch(err) {
		const username = await getUserById(id).username;
		cConsole.log(`ERROR: Could not get member data for ${username}.\nPlease make sure that this user is still in the server\n`);
		return null;
	}
	return output;
}

function randomizeArray(array) {
    var j, x;
	var index;
    for (index = array.length - 1; index > 0; index--) {
        j = Math.round(Math.random() * (index + 1));
        x = array[index];
        array[index] = array[j];
        array[j] = x;
    }
	for (let i = 0; i < array.length; i++) {
		if (!array[i]) {
			array.splice(i, 1);
		}
	}
    return array;
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getArrayElementByChance(input, odds) {
    var array = [];
    for (let i = 0; i < input.length; i++) {
        const item = input[i];
        for (let o = 0; o < Math.round(odds[i]); o++) {
            array.push(item);
        }
    }
    return array[getRandomInt(0, array.length - 1)]
}

function roundToFloat(number, decimal) {
    var numberSplit = number.toString().split('.');
	if (!numberSplit[1]) {numberSplit[1] = '000000000000000000000000000000000000000000000000000000'}
	var decimalArray = numberSplit[1].split('');

	var result = numberSplit[0] + '.';
	for (let i = 0; i < decimal; i++) {
		result += decimalArray[i]
	}
	return parseFloat(result).toFixed(decimal);
}
// function roundToFloat(number, decimal) {
//     var output = + (Math.round(number + "e+" + decimal) + "e-" + decimal);
//     if (!output.toString().includes('.')) {output += '.00';}
//     return parseFloat(output).toFixed(2);
// }

function getAllCobinations(set, size) {
	// Sournce: https://gist.github.com/axelpale/3118596
	var k, i, combs, k_combs;
	combs = [];
	
	// Calculate all non-empty k-combinations
	for (k = 1; k <= set.length; k++) {
		k_combs = k_combinations(set, k);
		for (i = 0; i < k_combs.length; i++) {
			if (k_combs[i].length != size) {continue}
			combs.push(k_combs[i]);
			// console.log(k_combs[i])
		}
	}
	return combs;
}
function k_combinations(set, k) {
	// Sournce: https://gist.github.com/axelpale/3118596
	var i, j, combs, head, tailcombs;
	
	// There is no way to take e.g. sets of 5 elements from
	// a set of 4.
	if (k > set.length || k <= 0) {
		return [];
	}
	
	// K-sized set has only one K-sized subset.
	if (k == set.length) {
		return [set];
	}
	
	// There is N 1-sized subsets in a N-sized set.
	if (k == 1) {
		combs = [];
		for (i = 0; i < set.length; i++) {
			combs.push([set[i]]);
		}
		return combs;
	}
	combs = [];
	for (i = 0; i < set.length - k + 1; i++) {
		// head is a list that includes only our current element.
		head = set.slice(i, i + 1);
		// We take smaller combinations from the subsequent elements
		tailcombs = k_combinations(set.slice(i + 1), k - 1);
		// For each (k-1)-combination we join it with the current
		// and store it to the set of k-combinations.
		for (j = 0; j < tailcombs.length; j++) {
			combs.push(head.concat(tailcombs[j]));
			// console.log(head.concat(tailcombs[j]))
		}
	}
	return combs;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function isObject(target) {
	try {
		var o = JSON.parse(JSON.stringify(target));
		if (o && typeof o === "object"  && !Array.isArray(target)) {
			return true;
		}
	}
	catch (e) { }
	return false;
}

function getTimestamp(date) {
	const inRawTime = typeof date == 'object' ? false : true; // If date is an object, it is most likely a Date()
	const rawTime = inRawTime ? date.toString() : date.getTime().toString();
	const timeSplit = rawTime.split('');
	const time = timeSplit.splice(0, 10).join('');
	return time;
}

function getTimeAgo(start = new Date(), end = new Date(), prettyNumbers = false, timerOutput = false) {
	const diffInMs = new Date(end) - new Date(start);
	const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
	const hours = Math.floor(diffInMs / (1000 * 60 * 60) - (24 * days));
	const minutes = Math.floor(diffInMs / (1000 * 60) - (days * 24 * 60) - (hours * 60));
	const seconds = Math.floor(diffInMs / (1000) - (days*24*60*60)-(hours*60*60)-(minutes*60));
	
	var outputDays = days;
	var outputHours = hours;
	var outputMinutes = minutes;
	var outputSeconds = seconds;

	if (prettyNumbers) {
		if (outputDays.toString().split('').length != 2) {
			outputDays = '0' + outputDays;
		}
		if (outputHours.toString().split('').length != 2) {
			outputHours = '0' + outputHours;
		}
		if (outputMinutes.toString().split('').length != 2) {
			outputMinutes = '0' + outputMinutes;
		}
		if (outputSeconds.toString().split('').length != 2) {
			outputSeconds = '0' + outputSeconds;
		}
	}
	if (timerOutput) {
		var output = `${outputMinutes}:${outputSeconds}`;
		if (hours != 0) output = `${outputHours}:${output}`;
		if (days != 0) output = `${outputDays}:${output}`;
		return output;
	}
	return [outputDays, outputHours, outputMinutes, outputSeconds]
}

module.exports.info = {
    getUserById,
	getMemberById,
	isObject
}
module.exports.generate = {
    randomizeArray,
    getRandomInt,
    getArrayElementByChance,
    roundToFloat,
    getAllCobinations,
	getTimestamp,
	getTimeAgo
}
module.exports.actions = {
    sleep
}