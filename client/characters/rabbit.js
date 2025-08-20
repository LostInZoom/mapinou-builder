import { generateRandomInteger } from "../utils/math.js";
import Sprite from "../cartography/sprite.js";
import Character from "./character.js";
import { wait } from "../utils/dom.js";

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

        this.feature.properties.color = this.color;
        this.feature.properties.state = this.state;
        this.feature.properties.orientation = this.orientation;
        this.feature.properties.frame = this.frame;
        this.feature.properties.scale = this.scale;

        this.layer.addCharacter(this);
        this.animateFrame();
    }
}

export default Rabbit;