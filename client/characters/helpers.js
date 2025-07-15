import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Style } from "ol/style";
import { getVectorContext } from "ol/render";
import { LineString } from "ol/geom";

import { getColorsByClassNames } from "../utils/parse.js";
import { easeInSine, easeOutSine, generateRandomInteger } from "../utils/math.js";
import Character from "./character.js";
import { buffer } from "../cartography/analysis.js";
import Sprite from "../cartography/sprite.js";

class Helpers {
    constructor(options) {
        this.options = options || {};
        this.helpers = [];
        if (this.options.coordinates) {
            this.options.coordinates.forEach((coords) => {
                let o = this.options;
                o['coordinates'] = coords;
                this.helpers.push(new Helper(o));
            });
        }
    }

    display() {
        this.helpers.forEach((helper) => { helper.display(); })
    }

    hide() {
        this.helpers.forEach((helper) => { helper.hide(); });
    }

    despawn(callback) {
        callback = callback || function () {};
        let amount = this.getActiveHelpers().length;
        let done = 0;
        this.helpers.forEach((helper) => {
            helper.despawn(() => {
                helper.destroy();
                if (++done === amount) { callback(); }
            });
        });
    }

    getHelpers() {
        return this.helpers;
    }

    getActiveHelpers() {
        let a = [];
        this.helpers.forEach((helper) => {
            if (helper.isActive()) { a.push(helper); }
        });
        return a;
    }
}

class Helper extends Character {
    constructor(options) {
        super(options);
        this.scale = 1;
        this.visible = false;
        this.sprite = new Sprite({
            type: 'static',
            layer: this.layer,
            src: './sprites/vegetables.png',
            width: 64,
            height: 64,
            scale: this.scale,
            framerate: 50,
            // The image is a random sprite inside the provided vegetables
            offset: [ generateRandomInteger(0, 9) * 64, 0 ],
            coordinates: this.coordinates,
            maxScale: 1,
            minScale: 0.6,
            increment: 0.05,
        });
        this.sprite.setScale(0);
        this.sprite.setOpacity(1);
    }

    reveal(callback) {
        callback = callback || function() {};
        this.cancelScaleAnimation();
        this.visible = true;
        let goal = this.scale;
        this.sprite.animateScale(goal * 1.2, easeOutSine, this.sprite.spawnIncrement, this.sprite.spawnFramerate, () => {
            this.sprite.animateScale(goal, easeInSine, this.sprite.spawnIncrement, this.sprite.spawnFramerate, () => {
                callback();
            });
        });
    }

    hide(callback) {
        callback = callback || function() {};
        this.cancelScaleAnimation();
        this.visible = false;
        this.sprite.animateScale(0, easeOutSine, this.sprite.spawnIncrement, this.sprite.spawnFramerate, () => {
            callback();
        });
    }

    isVisible() {
        return this.visible;
    }

    cancelScaleAnimation() {
        this.sprite.cancelScaleAnimation();
    }

    breathe() {
        this.sprite.breathe(0.8, 1.2);
    }

    consume() {
        this.deactivate();
        this.basemap.options.app.sounds.playFile({
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

export { Helpers, Helper }