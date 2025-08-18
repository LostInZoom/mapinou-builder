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
        this.frameSize = 64;

        let colors = getColorsByClassNames('enemies-map', 'enemies-map-transparent');

        let sizeArea = this.params.game.tolerance.enemies;
        this.width1 = 50;
        this.width2 = 10;

        let b1 = buffer(this.coordinates, sizeArea - this.width1);
        let coords1 = b1.getLinearRings()[0].getCoordinates();
        this.border1 = new Feature({ geometry: bufferAroundPolygon(coords1, this.width1) });
        this.style1 = new Style({
            fill: new Fill({ color: colors['enemies-map-transparent'] })
        });
        this.border1.setStyle(this.style1);

        let b2 = buffer(this.coordinates, sizeArea - this.width2);
        let coords2 = b2.getLinearRings()[0].getCoordinates();
        this.border2 = new Feature({ geometry: bufferAroundPolygon(coords2, this.width2) });
        this.style2 = new Style({
            fill: new Fill({ color: colors['enemies-map'] })
        });
        this.border2.setStyle(this.style2);

        this.area = new VectorLayer({
            source: new VectorSource({
                features: [this.border1, this.border2],
            }),
            zIndex: this.zIndex - 1,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            opacity: 0,
        });

        this.areaVisible = false;

        this.layer.basemap.map.addLayer(this.area);
        this.layer.basemap.layers.push(this.area);

        this.listener = this.layer.basemap.map.on('postrender', () => {
            let threshold = this.params.game.routing;
            let zoom = this.layer.basemap.view.getZoom();
            if (zoom >= threshold && !this.areaVisible) {
                this.areaVisible = true;
                this.revealArea();
            }
            else if (zoom < threshold && this.areaVisible) {
                this.areaVisible = false;
                this.hideArea();
            }
        });
        this.layer.basemap.addListeners(this.listener);
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
        this.frameScale = 0.9;

        this.states = { idle: { line: 0, length: 5 } };
        this.state = options.state || 'idle';
        this.frameRate = 150;
        this.frameOffset = 0;

        this.offset = [
            this.frameSize * this.framePosition,
            this.frameOffset + this.frameSize * this.states[this.state].line
        ]
        this.feature.set('offset', this.offset);

        this.animateFrame();

        // this.sprite = new Sprite({
        //     type: 'dynamic',
        //     layer: this.layer,
        //     src: './sprites/hunter.png',
        //     width: 64,
        //     height: 64,
        //     scale: 0.9,
        //     anchor: [0.5, 0.8],
        //     framerate: 150,
        //     coordinates: this.coordinates,
        //     states: this.states
        // }, () => {
        //     this.sprite.animate();
        // });
    }
}

class Snake extends Enemy {
    constructor(options) {
        super(options);
        this.orientable = true;
        this.frameScale = 0.8;
        this.frameOffset = 128;

        this.states = {
            idle: {
                north: { line: 0, length: 3 },
                east: { line: 1, length: 3 },
                south: { line: 2, length: 3 },
                west: { line: 3, length: 3 },
            }
        }
        this.state = options.state || 'idle';
        this.frameRate = 200;

        this.offset = [
            this.frameSize * this.framePosition,
            this.frameOffset + this.frameSize * this.states[this.state].south.line
        ]
        this.feature.set('offset', this.offset);

        this.animateFrame();

        // this.sprite = new Sprite({
        //     type: 'dynamic',
        //     layer: this.layer,
        //     src: './sprites/snake.png',
        //     width: 64,
        //     height: 64,
        //     scale: 0.85,
        //     anchor: [0.5, 0.6],
        //     framerate: 200,
        //     coordinates: this.coordinates,
        //     states: this.states
        // }, () => {
        //     this.sprite.animate();
        // });
    }
}

class Bird extends Enemy {
    constructor(options) {
        super(options);
        this.orientable = false;
        this.states = { idle: { line: 0, length: 3 } };
        this.state = options.state || 'idle';
        this.frameRate = 200;
        this.frameScale = 1;
        this.frameOffset = 64;

        this.offset = [
            this.frameSize * this.framePosition,
            this.frameOffset + this.frameSize * this.states[this.state].line
        ]
        this.feature.set('offset', this.offset);

        this.animateFrame();

        // this.sprite = new Sprite({
        //     type: 'dynamic',
        //     layer: this.layer,
        //     src: './sprites/bird.png',
        //     width: 64,
        //     height: 64,
        //     scale: 1,
        //     anchor: [0.5, 0.5],
        //     framerate: 200,
        //     coordinates: this.coordinates,
        //     states: this.states
        // }, () => {
        //     this.sprite.animate();
        // });
    }
}

export { Enemy, Hunter, Snake, Bird };