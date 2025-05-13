import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Style } from "ol/style";
import { getVectorContext } from "ol/render";
import { LineString } from "ol/geom";

import { Sprite } from "../cartography/sprite.js";
import { getColorsByClassNames, generateRandomInteger } from "../utils/parse.js";
import Character from "./character.js";
import { buffer } from "../cartography/analysis.js";

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
        this.helpers.forEach((helper) => { helper.hide(); })
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
        this.sprite = new Sprite({
            type: 'static',
            layer: this.layer,
            src: './assets/sprites/vegetables.png',
            width: 64,
            height: 64,
            scale: 1,
            framerate: 50,
            // The image is a random sprite inside the provided vegetables
            offset: [ generateRandomInteger(0, 9) * 64, 0 ],
            coordinates: this.coordinates,
            maxScale: 1,
            minScale: 0.6,
            increment: 0.05,
        });
    }

    consume() {
        this.deactivate();
        console.log('burst')

        this.sprite.makeDynamic({
            src: './assets/sprites/burst.png',
            loop: false,
            width: 64,
            height: 64,
            framerate: 100,
            scale: 0.5,
            state: 'burst',
            states: {
                burst: {
                    south: { line: 0, length: 7 },
                }
            }
        });
    }
}

export { Helpers }