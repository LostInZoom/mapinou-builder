import Sprite from "../cartography/sprite";
import Character from "./character";

class Flower extends Character {
    constructor(options) {
        super(options);
        this.level = options.level;
        this.states = {
            idle: { south: { line: 1, length: 1 } },
            grow: { south: { line: 0, length: 6 } },
            decay: { south: { line: 2, length: 4 } }
        }

        this.sprite = new Sprite({
            type: 'dynamic',
            layer: this.layer,
            src: './sprites/flower.png',
            width: 32,
            height: 32,
            scale: 1,
            anchor: [0.5, 0.9],
            loop: false,
            framerate: 50,
            coordinates: this.coordinates,
            states: this.states,
            state: 'grow'
        }, () => {
            this.sprite.animate();
        });
        this.sprite.setOpacity(1);
    }

    decay() {
        this.sprite.freeze();
        this.sprite.setState('decay');
        this.sprite.animate(() => {
            this.destroy();
        });
    }
}

export default Flower;