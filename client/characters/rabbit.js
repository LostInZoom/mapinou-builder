import { generateRandomInteger } from "../utils/math.js";
import Sprite from "../cartography/sprite.js";
import Character from "./character.js";

class Rabbit extends Character {
    constructor(options) {
        super(options);
        this.sheetSize = 624;
        this.colors = options.colors || ['white', 'sand', 'brown', 'grey'];
        this.color = options.color || 'white';

        this.colorsPosition = ['white', 'sand', 'brown', 'grey'];

        this.states = {
            idle: {
                north: { line: 9, length: 4 },
                east: { line: 10, length: 4 },
                south: { line: 8, length: 4 },
                west: { line: 11, length: 4 },
            },
            move: {
                north: { line: 1, length: 4 },
                east: { line: 2, length: 4 },
                south: { line: 0, length: 4 },
                west: { line: 3, length: 4 },
            },
            graze: {
                north: { line: 5, length: 4 },
                east: { line: 6, length: 4 },
                south: { line: 4, length: 4 },
                west: { line: 7, length: 4 },
            }
        }
        this.weights = [1, 10, 30];
        this.statespool = ['move', 'graze', 'idle'];

        this.state = options.state || 'idle';
        this.orientable = true;

        this.frameSize = 52;

        if (this.color === 'random') {
            let i = generateRandomInteger(0, this.colors.length - 1);
            this.color = this.colors[i];
        }
        this.offset = [
            this.frameSize * this.framePosition,
            (this.colorsPosition.indexOf(this.color) * this.sheetSize) + (this.frameSize * this.states[this.state].south.line)
        ]
        this.feature.set('offset', this.offset);
        this.speed = options.speed || 20;
    }
}



export default Rabbit;