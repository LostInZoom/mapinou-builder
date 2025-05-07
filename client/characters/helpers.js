import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Style } from "ol/style";
import { getVectorContext } from "ol/render";
import { LineString } from "ol/geom";

import { StaticSprite } from "../cartography/sprite.js";
import { getColorsByClassNames, generateRandomInteger } from "../utils/parse.js";
import Character from "./character.js";
import { buffer } from "../cartography/analysis.js";

class Helpers {
    constructor(options) {
        this.options = options || {};
        this.helpers = [];
        if (this.options.coordinates) {
            this.options.coordinates.forEach((coords) => {
                this.helpers.push(new Helper({
                    basemap: this.options.basemap,
                    coordinates: coords,
                    zindex: this.options.zindex
                }));
            });
        }
    }

    display() {
        this.helpers.forEach((helper) => { helper.display(); })
    }

    hide() {
        this.helpers.forEach((helper) => { helper.hide(); })
    }

    getHelpers() {
        return this.helpers;
    }
}

class Helper extends Character {
    constructor(options) {
        super(options);
        this.sprite = new StaticSprite({
            layer: this.layer,
            src: './assets/sprites/vegetables.png',
            width: 32,
            height: 32,
            scale: 2,
            framerate: 100,
            offset: [ generateRandomInteger(0, 9) * 32, 0 ],
            coordinates: this.coordinates,
        });

        let sizeArea = this.basemap.params.game.tolerance.bonus;
        this.area = new VectorLayer({
            source: new VectorSource({
                features: [
                    new Feature({ geometry: buffer(this.coordinates, sizeArea) })
                ],
            }),
            style: new Style({
                fill: new Fill({
                    color: getColorsByClassNames('bonus-transparent')['bonus-transparent']
                })
            }),
            zIndex: this.zindex - 1,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            minZoom: 13,
            opacity: 0,
        });

        this.basemap.map.addLayer(this.area);
        this.basemap.layers.push(this.area);
    }
}

export { Helpers }