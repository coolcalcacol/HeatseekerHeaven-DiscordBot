const generalData = require("../data/generalData")

async function getUserById(id) {
    return await generalData.client.users.fetch(id).catch(console.error);
}
async function getMemberById(id) {
    return await generalData.client.members.fetch(id).catch(console.error);
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

module.exports.info = {
    getUserById,
	getMemberById
}
module.exports.generate = {
    randomizeArray,
    getRandomInt,
    getArrayElementByChance,
    roundToFloat,
    getAllCobinations
}
module.exports.actions = {
    sleep
}