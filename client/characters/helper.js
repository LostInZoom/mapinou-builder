import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Style } from "ol/style";
import { getVectorContext } from "ol/render";
import { LineString } from "ol/geom";

import { getColorsByClassNames } from "../utils/parse.js";
import { easeInSine, easeOutSine, generateRandomInteger } from "../utils/math.js";
import Character from "../characters/character.js";
import { buffer } from "../cartography/analysis.js";
import Sprite from "../cartography/sprite.js";

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

    reveal(callback) {
        callback = callback || function () { };
        this.stopScaleAnimation();
        this.visible = true;
        this.spawn(callback);
    }

    hide(callback) {
        callback = callback || function () { };
        this.stopScaleAnimation();
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

        this.sprite.destroy();
        this.sprite = new Sprite({
            type: 'dynamic',
            layer: this.layer,
            src: './sprites/burst.png',
            loop: false,
            width: 64,
            height: 64,
            scale: 0.8,
            anchor: [0.5, 0.5],
            framerate: 80,
            coordinates: this.coordinates,
            state: 'burst',
            states: { burst: { south: { line: 0, length: 6 }, } }
        }, () => {
            this.sprite.display();
            this.sprite.animate(() => {
                this.sprite.destroy();
            });
        });
    }
}

export default Helper;