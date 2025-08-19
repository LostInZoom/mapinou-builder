import { generateRandomInteger } from "../utils/math.js";
import Sprite from "../cartography/sprite.js";
import Character from "./character.js";

class Rabbit extends Character {
    constructor(options) {
        super(options);

        this.speed = options.speed || 20;
        this.colors = options.colors || ['white', 'sand', 'brown', 'grey'];
        this.color = options.color || 'white';

        if (this.color === 'random') {
            let i = generateRandomInteger(0, this.colors.length - 1);
            this.color = this.colors[i];
        }

        this.weights = [1, 10, 30];
        this.statespool = ['move', 'graze', 'idle'];

        this.size = 52;

        this.state = options.state || 'idle';
        this.orientable = true;
        this.orientation = options.orientation || 'south';

        
    }

    setColor(color) {
        this.color = color;
        this.frame = 0;
    }
}



export default Rabbit;