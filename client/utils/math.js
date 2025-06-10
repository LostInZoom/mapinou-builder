/**
 * Generate a random integer in a given range.
 * @param  {int} min - Min int.
 * @param  {int} max - Max int.
 * @return {int} - Random int.
 */
function generateRandomInteger(min, max) {
    if (min == max) { return min; }
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedRandom(items, weights) {
    var i;
    for (i = 1; i < weights.length; i++) {
        weights[i] += weights[i - 1];
    }
    var random = Math.random() * weights[weights.length - 1];
    for (i = 0; i < weights.length; i++) {
        if (weights[i] > random)
            break;
    }    
    return items[i];
}

function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
}

function remap(value, xmin, xmax, dmin=0, dmax=1) {
    return dmin + ((value - xmin) / (xmax - xmin)) * (dmax - dmin);
}

export { generateRandomInteger, weightedRandom, easeOutCubic, remap };