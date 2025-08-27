import { easeInQuint, easeOutQuint, generateRandomInteger } from "../utils/math.js";
import Character from "../characters/character.js";
import { wait } from "../utils/dom.js";

class Helper extends Character {
    constructor(options) {
        super(options);

        this.size = 64;
        this.visible = false;

        this.types = [
            'leek', 'cabbage', 'chard', 'broccoli', 'radish',
            'turnip', 'zucchini', 'beet', 'squash', 'butternut'
        ]
        this.type = this.types[generateRandomInteger(0, 9)];
        this.feature.properties.type = this.type;
        this.feature.properties.scale = this.scale;

        this.layer.addCharacter(this);
    }

    setType(type) {
        this.type = type;
        this.feature.properties.type = type;
        this.layer.updateSource();
    }

    reveal(callback) {
        callback = callback || function () { };
        this.visible = true;
        this.spawn(() => {
            this.breathe();
            callback();
        });
    }

    hide(callback) {
        callback = callback || function () { };
        this.visible = false;
        this.despawn(callback);
    }

    isVisible() {
        return this.visible;
    }

    consume() {
        this.deactivate();

        this.app.sounds.playFile({
            src: './sounds/crounch',
            format: 'mp3',
            amount: 3,
        });

        this.animateScale({
            value: 1.5,
            duration: 100,
            easing: easeOutQuint
        }, () => {
            wait(200, () => {
                this.animateScale({
                    value: 0,
                    duration: 300,
                    overshoot: 1.1,
                    easing: easeInQuint
                }, () => {
                    this.destroy();
                });
            })
        })
    }
}

export default Helper;