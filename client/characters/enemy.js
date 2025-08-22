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

        // let sizeArea = this.params.game.tolerance.enemies;
        // this.width1 = 50;
        // this.width2 = 10;

        // let b1 = buffer(this.coordinates, sizeArea - this.width1);
        // let coords1 = b1.getLinearRings()[0].getCoordinates();
        // this.border1 = new Feature({ geometry: bufferAroundPolygon(coords1, this.width1) });
        // this.style1 = new Style({
        //     fill: new Fill({ color: colors['enemies-map-transparent'] })
        // });
        // this.border1.setStyle(this.style1);

        // let b2 = buffer(this.coordinates, sizeArea - this.width2);
        // let coords2 = b2.getLinearRings()[0].getCoordinates();
        // this.border2 = new Feature({ geometry: bufferAroundPolygon(coords2, this.width2) });
        // this.style2 = new Style({
        //     fill: new Fill({ color: colors['enemies-map'] })
        // });
        // this.border2.setStyle(this.style2);

        // this.area = new VectorLayer({
        //     source: new VectorSource({
        //         features: [this.border1, this.border2],
        //     }),
        //     zIndex: this.zIndex - 1,
        //     updateWhileAnimating: true,
        //     updateWhileInteracting: true,
        //     opacity: 0,
        // });

        // this.areaVisible = false;

        // this.layer.basemap.map.addLayer(this.area);
        // this.layer.basemap.layers.push(this.area);

        // this.listener = this.layer.basemap.map.on('postrender', () => {
        //     let threshold = this.params.game.routing;
        //     let zoom = this.layer.basemap.view.getZoom();
        //     if (zoom >= threshold && !this.areaVisible) {
        //         this.areaVisible = true;
        //         this.revealArea();
        //     }
        //     else if (zoom < threshold && this.areaVisible) {
        //         this.areaVisible = false;
        //         this.hideArea();
        //     }
        // });
        // this.layer.basemap.addListeners(this.listener);
    }

    revealArea(callback) {
        this.stopAnimation();
        this.animateOpacity(1, callback);
    }

    hideArea(callback) {
        this.stopAnimation();
        this.animateOpacity(0, callback);
    }

    stopAnimation() {
        if (this.animation) { unByKey(this.animation); }
    }

    animateOpacity(value, callback) {
        callback = callback || function () { };
        let opacity = this.area.getOpacity();
        const difference = value - opacity;
        const increment = difference > 0 ? 0.08 : -0.08;

        if (difference === 0) {
            callback();
        } else {
            this.animation = this.area.on('postrender', () => {
                opacity += increment;
                this.area.setOpacity(opacity);
                let stop = false;
                if (difference > 0 && opacity >= value) { stop = true; }
                else if (difference < 0 && opacity <= value) { stop = true; }

                if (stop) {
                    this.stopAnimation();
                    unByKey(this.animation);
                    callback();
                } else {
                    // Render the map to trigger the listener
                    this.layer.basemap.map.render();
                }
            });
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