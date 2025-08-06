import { generateRandomInteger } from "../utils/math.js";
import Sprite from "../cartography/sprite.js";
import Character from "./character.js";

class Rabbit extends Character {
    constructor(options) {
        super(options);
        this.colors = [ 'white', 'sand', 'brown', 'grey'];
        this.color = options.color || 'white';
        this.offsets = {
            'white': [0, 0],
            'sand': [0, 624],
            'brown': [0, 624*2],
            'grey': [0, 624*3],
        }

        if (this.color === 'random') {
            let i = generateRandomInteger(0, this.colors.length - 1);
            this.color = this.colors[i];
        }

        this.feature.set('offset', this.offsets[this.color]);

        this.speed = options.speed || 20;
        this.weights = [ 1, 10, 30 ];
        this.statespool = [ 'move', 'graze', 'idle' ];

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

        // this.sprite = new Sprite({
        //     type: 'dynamic',
        //     layer: this.layer,
        //     src: `./sprites/rabbit-${this.color}.png`,
        //     width: this.width,
        //     height: this.height,
        //     scale: 1,
        //     anchor: [0.5, 0.8],
        //     framerate: 150,
        //     coordinates: this.coordinates,
        //     states: this.states,
        // }, () => {
        //     this.sprite.animate();
        // });
    }
}



export default Rabbit;