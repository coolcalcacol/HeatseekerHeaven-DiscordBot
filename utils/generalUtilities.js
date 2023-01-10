const generalData = require('../data/generalData');
const cConsole = require('./customConsoleLog');
const playerData = require('../data/playerData');
const PlayerDatabase = require('../data/database/playerDataStorage');

const { errorLogWebhook } = require('../config/private.json');
const Errorhandler = require('discord-error-handler');

async function getUserById(id) {
	return await generalData.client.users.fetch(id).catch(console.error);
}
async function getMemberById(id) {
	const guild = await generalData.client.guilds.cache.get(generalData.botConfig.defaultGuildId);
	let output;
	try {
		output = await guild.members.fetch(id);
	}
	catch (err) {
		// const username = await getUserById(id).username;
		const targetPlayerData = await playerData.getPlayerDataById(id).catch(console.error);

		await handleError().createrr(generalData.client, generalData.botConfig.defaultGuildId, 'Could not get member data for```\n<@' + id + '> ```' + id, err);
		cConsole.log(`ERROR: Could not get member data for ${targetPlayerData.userData.name} [${id}].\nPlease make sure that this user is still in the server\n`);

		if (targetPlayerData) {
			targetPlayerData.userData.isMember = false;
			await PlayerDatabase.updateOne({ _id: targetPlayerData._id }, targetPlayerData).catch(console.error);
		}

		return null;
	}
	return output;
}

function handleError() {
	return new Errorhandler(generalData.client, {
		webhook: {
			id: errorLogWebhook.id,
			token: errorLogWebhook.token,
		},
	});
}

function randomizeArray(array) {
	let j, x;
	let index;
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
	const array = [];
	for (let i = 0; i < input.length; i++) {
		const item = input[i];
		for (let o = 0; o < Math.round(odds[i]); o++) {
			array.push(item);
		}
	}
	return array[getRandomInt(0, array.length - 1)];
}

function roundToFloat(number, decimal) {
	const numberSplit = number.toString().split('.');
	if (!numberSplit[1]) {numberSplit[1] = '000000000000000000000000000000000000000000000000000000';}
	const decimalArray = numberSplit[1].split('');

	let result = numberSplit[0] + '.';
	for (let i = 0; i < decimal; i++) {
		result += decimalArray[i];
	}
	return parseFloat(result).toFixed(decimal);
}
// function roundToFloat(number, decimal) {
//     var output = + (Math.round(number + "e+" + decimal) + "e-" + decimal);
//     if (!output.toString().includes('.')) {output += '.00';}
//     return parseFloat(output).toFixed(2);
// }

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

function isObject(target) {
	try {
		const o = JSON.parse(JSON.stringify(target));
		if (o && typeof o === 'object' && !Array.isArray(target)) {
			return true;
		}
	}
	catch (e) {
		// handle errors
	}
	return false;
}

function getTimestamp(date) {
	const inRawTime = typeof date != 'object'; // If date is an object, it is most likely a Date()
	const rawTime = inRawTime ? date.toString() : date.getTime().toString();
	const timeSplit = rawTime.split('');
	return timeSplit.splice(0, 10).join('');
}

function getTimeAgo(start = new Date(), end = new Date(), prettyNumbers = false, timerOutput = false) {
	const diffInMs = new Date(end) - new Date(start);
	const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
	const hours = Math.floor(diffInMs / (1000 * 60 * 60) - (24 * days));
	const minutes = Math.floor(diffInMs / (1000 * 60) - (days * 24 * 60) - (hours * 60));
	const seconds = Math.floor(diffInMs / (1000) - (days * 24 * 60 * 60) - (hours * 60 * 60) - (minutes * 60));

	let outputDays = days,
		outputHours = hours,
		outputMinutes = minutes,
		outputSeconds = seconds;

	if (prettyNumbers) {
		outputDays = `0${days}`.slice(-2);
		outputHours = `0${hours}`.slice(-2);
		outputMinutes = `0${minutes}`.slice(-2);
		outputSeconds = `0${seconds}`.slice(-2);
	}
	if (timerOutput) {
		let output = `${outputMinutes}:${outputSeconds}`;
		if (hours !== 0) output = `${outputHours}:${output}`;
		if (days !== 0) output = `${outputDays}:${output}`;
		return output;
	}
	return [outputDays, outputHours, outputMinutes, outputSeconds];
}

// #region combos
function getAllCombinations(set, size) {
	// Source: https://gist.github.com/axelpale/3118596
	let k, i, k_combs;
	const combs = [];

	// Calculate all non-empty k-combinations
	for (k = 1; k <= set.length; k++) {
		k_combs = k_combinations(set, k);
		for (i = 0; i < k_combs.length; i++) {
			if (k_combs[i].length !== size) {continue;}
			combs.push(k_combs[i]);
			// console.log(k_combs[i])
		}
	}
	return combs;
}
function k_combinations(set, k) {
	// Source: https://gist.github.com/axelpale/3118596
	let i, j, combs, head, tailCombs;

	// There is no way to take e.g. sets of 5 elements from
	// a set of 4.
	if (k > set.length || k <= 0) {
		return [];
	}

	// K-sized set has only one K-sized subset.
	if (k === set.length) {
		return [set];
	}

	// There is N 1-sized subsets in an N-sized set.
	if (k === 1) {
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
		tailCombs = k_combinations(set.slice(i + 1), k - 1);
		// For each (k-1)-combination we join it with the current
		// and store it to the set of k-combinations.
		for (j = 0; j < tailCombs.length; j++) {
			combs.push(head.concat(tailCombs[j]));
			// console.log(head.concat(tailCombs[j]))
		}
	}
	return combs;
}
// #endregion


// #region Get Caller/Stack
class CallSiteObject {
	constructor(stack) {
		this.type = stack.getTypeName();
		this.function = stack.getFunctionName();
		this.functionName = stack.getFunctionName();
		this.fileName = stack.getFileName();
		this.lineNumber = stack.getLineNumber();
		this.columnNumber = stack.getColumnNumber();
		this.evalOrigin = stack.getEvalOrigin();
		this.isToplevel = stack.isToplevel();
		this.isEval = stack.isEval();
		this.isNative = stack.isNative();
		this.isConstructor = stack.isConstructor();
	}
}

function getCallerObject() {
	const stack = getStack();

	// Remove superfluous function calls on stack
	stack.shift(); // getCaller --> getStack

	// Return caller's caller
	return new CallSiteObject(stack[1]);
}

function getStack() {
	// Save original Error.prepareStackTrace
	const origPrepareStackTrace = Error.prepareStackTrace;

	// Override with function that just returns `stack`
	Error.prepareStackTrace = function(_, stack) {
		return stack;
	};

	// Create a new `Error`, which automatically gets `stack`
	const err = new Error();

	// Evaluate `err.stack`, which calls our new `Error.prepareStackTrace`
	const stack = err.stack;

	// Restore original `Error.prepareStackTrace`
	Error.prepareStackTrace = origPrepareStackTrace;

	// Remove superfluous function call on stack
	stack.shift(); // getStack --> Error

	return stack;
}
// #endregion


module.exports.info = {
	getUserById,
	getMemberById,
	isObject,
};
module.exports.generate = {
	randomizeArray,
	getRandomInt,
	getArrayElementByChance,
	roundToFloat,
	getAllCombinations,
	getTimestamp,
	getTimeAgo,
	getCallerObject,
};
module.exports.actions = {
	handleError,
	sleep,
};
