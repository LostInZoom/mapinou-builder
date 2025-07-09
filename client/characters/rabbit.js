import { generateRandomInteger } from "../utils/math.js";
import Sprite from "../cartography/sprite.js";
import Character from "./character.js";

class Rabbit extends Character {
    constructor(options) {
        super(options);
        this.colors = options.colors || [ 'white', 'grey', 'brown', 'sand' ];
        this.color = options.color || 'white';
        this.speed = options.speed || 20;

        if (this.color === 'random') {
            let i = generateRandomInteger(0, this.colors.length - 1);
            this.color = this.colors[i];
        }

        this.width = 64;
        this.height = 64;

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

        this.statespool = [ 'move', 'graze', 'idle' ];
        this.weights = [ 1, 10, 30 ];

        this.sprite = new Sprite({
            type: 'dynamic',
            layer: this.layer,
            src: `./sprites/rabbit-${this.color}.png`,
            width: 52,
            height: 52,
            scale: 1,
            framerate: 200,
            coordinates: this.coordinates,
            anchor: [0.5, 0.8],
            states: this.states,
        }, () => {
            this.sprite.animate();
        });
    }
}



export default Rabbit;