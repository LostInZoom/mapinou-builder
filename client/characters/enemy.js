import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import { Feature } from "ol";
import { unByKey } from "ol/Observable.js";
import { Fill, Style } from "ol/style.js";

import Character from "./character.js";
import Sprite from "../cartography/sprite.js";
import { buffer, bufferAroundPolygon } from "../cartography/analysis.js";
import { getColorsByClassNames } from "../utils/parse.js";

class Enemy extends Character {
    constructor(options) {
        super(options);
        this.size = 64;
        this.state = options.state || 'idle';
        this.orientation = options.orientation || 'south';

        this.feature.properties.state = this.state;
        this.feature.properties.orientation = this.orientation;
        this.feature.properties.frame = this.frame;
        this.feature.properties.scale = this.scale;

        let colors = getColorsByClassNames('enemies-map', 'enemies-map-transparent');

        let sizeArea = this.params.game.tolerance.enemies;
        this.width1 = 40;
        this.width2 = 10;

        let b1 = buffer(this.coordinates, sizeArea - this.width1);
        this.border1 = b1.geometry.coordinates;
        this.border2 = bufferAroundPolygon(b1, this.width2).geometry.coordinates;

        this.areaOpacity = 0;
        this.areaOpacityStart = 0;
        this.area1 = {
            type: 'Feature',
            properties: {
                color: colors['enemies-map-transparent'],
                opacity: this.areaOpacity
            },
            geometry: {
                type: 'Polygon',
                coordinates: this.border1
            }
        };

        this.area2 = {
            type: 'Feature',
            properties: {
                color: colors['enemies-map'],
                opacity: this.areaOpacity
            },
            geometry: {
                type: 'Polygon',
                coordinates: this.border2
            }
        };

        this.layer.addArea(this);
    }

    revealArea(callback) {
        this.areaOpacityStart = performance.now();
        this.animateAreaOpacity({
            value: 1,
            start: this.areaOpacityStart
        }, callback);
    }

    hideArea(callback) {
        this.areaOpacityStart = performance.now();
        this.animateAreaOpacity({
            value: 0,
            start: this.areaOpacityStart
        }, callback);
    }

    setAreaOpacity(opacity) {
        this.areaOpacity = opacity;
        this.area1.properties.opacity = opacity;
        this.area2.properties.opacity = opacity;
        this.layer.updateSourceArea();
    }

    animateAreaOpacity(options, callback) {
        callback = callback || function () { };

        if (this.active) {
            const value = options.value;
            const start = options.start;

            const origin = this.areaOpacity;
            const duration = options.duration || 300;
            const easing = options.easing || (x => x);

            const animation = (time) => {
                if (this.areaOpacityStart === start) {
                    const elapsed = time - start;
                    const t = Math.min(Math.max(elapsed / duration, 0), 1);
                    const eased = easing(t);
                    const opacity = origin + (value - origin) * eased;
                    this.setAreaOpacity(opacity);
                    if (t < 1) {
                        requestAnimationFrame(animation);
                    } else {
                        this.setAreaOpacity(value);
                        callback();
                    }
                } else {
                    callback();
                }
            };
            requestAnimationFrame(animation);
        }
    }
}

class Hunter extends Enemy {
    constructor(options) {
        super(options);
        this.orientable = false;
        this.framerate = 150;
        this.framenumber = 5;
        this.framescale = 0.9;
        this.offset = [0, -15];

        this.feature.properties.type = 'hunter';
        this.feature.properties.offset = this.offset;

        this.layer.addCharacter(this);
        this.animateFrame();
    }
}

class Snake extends Enemy {
    constructor(options) {
        super(options);
        this.orientable = true;
        this.framerate = 200;
        this.framenumber = 3;
        this.framescale = 0.8;

        this.feature.properties.type = 'snake';
        this.feature.properties.offset = this.offset;

        this.layer.addCharacter(this);
        this.animateFrame();
    }
}

class Bird extends Enemy {
    constructor(options) {
        super(options);
        this.orientable = false;
        this.framerate = 200;
        this.framenumber = 3;
        this.framescale = 1;

        this.feature.properties.type = 'bird';
        this.feature.properties.offset = this.offset;

        this.layer.addCharacter(this);
        this.animateFrame();
    }
}

export { Enemy, Hunter, Snake, Bird };