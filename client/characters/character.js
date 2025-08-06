import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import { angle, within } from "../cartography/analysis.js";
import { wait } from "../utils/dom.js";
import { unByKey } from "ol/Observable.js";
import { Feature } from "ol";
import { Point } from "ol/geom.js";
import { easeInCubic, easeOutCubic } from "../utils/math.js";

/**
 * Base class to create a new character on the map.
 */
class Character {
    constructor(options) {
        this.options = options || {};
        this.layer = this.options.layer;
        this.params = this.layer.params;

        this.zIndex = this.options.zIndex || 1;
        this.coordinates = this.options.coordinates;
        this.origin = this.options.coordinates;
        this.scale = this.options.scale || 0;

        this.spawnDuration = this.options.spawnDuration || 200;

        this.moving = false;
        this.active = true;
        this.travelled = 0;

        this.feature = new Feature({ geometry: new Point(options.coordinates) });
        if (this.options.index) { this.feature.set('id', index); }
        this.feature.set('scale', this.scale);

        this.layer.addCharacter(this);
    }

    getFeature() {
        return this.feature;
    }

    getSpawnDuration() {
        return this.spawnDuration;
    }

    spawn(callback) {
        callback = callback || function() {};
        this.feature.set('scale', [0, 0]);
        this.animateScale({
            value: 1,
            duration: this.spawnDuration,
            easing: easeOutCubic
        }, callback);
    }

    despawn(callback) {
        callback = callback || function() {};
        this.animateScale({
            value: 0,
            duration: this.spawnDuration,
            easing: easeInCubic,
        }, callback);
    }

    destroy() {
        this.layer.removeCharacter(this);
    }

    animateScale(options, callback) {
        callback = callback || function() {};

        const origin = this.feature.get('scale')[0];
        const value = options.value;

        const duration = options.duration || 200;
        const overshoot = options.overshoot || 1.1;
        const easing = options.easing || linear;
        let overshootRatio = options.overshootRatio || 0.7;
        overshootRatio = Math.max(0.01, Math.min(0.99, overshootRatio));

        const start = performance.now();
        const animate = (time) => {
            const elapsed = time - start;
            const t = Math.min(Math.max(elapsed / duration, 0), 1);

            let scale;
            const hasOvershoot = Math.abs(overshoot - 1) > 0.0001;

            if (origin < value) {
                if (!hasOvershoot) {
                    scale = easing(t);
                } else if (t < overshootRatio) {
                    const t1 = t / overshootRatio;
                    scale = easing(t1) * overshoot;
                } else {
                    const t2 = (t - overshootRatio) / (1 - overshootRatio);
                    scale = overshoot - easing(t2) * (overshoot - 1);
                }
            } else {
                if (!hasOvershoot) {
                    scale = 1 - easing(t);
                } else if (t < (1 - overshootRatio)) {
                    const t1 = t / (1 - overshootRatio);
                    scale = 1 + easing(t1) * (overshoot - 1);
                } else {
                    const t2 = (t - (1 - overshootRatio)) / overshootRatio;
                    scale = overshoot * (1 - easing(t2));
                }
            }

            this.feature.set('scale', [scale, scale]);

            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                this.feature.set('scale', [value, value]);
                callback();
            }
        };
        requestAnimationFrame(animate);
    }









    // destroy() {
    //     this.active = false;
    //     this.basemap.map.removeLayer(this.layer);
    //     for (let i = 0; i < this.basemap.layers.length; i++) {
    //         if (this.layer === this.basemap.layers[i]) {
    //             this.basemap.layers.splice(i, 1);
    //             break;
    //         }
    //     }
    // }

    // spawn(callback) {
    //     if (this.sprite) {
    //         this.sprite.spawn(callback);
    //         this.layer.changed();
    //     }
    // }

    // despawn(callback) {
    //     callback = callback || function() {};
    //     if (this.sprite) {
    //         this.sprite.despawn(() => {
    //             this.destroy();
    //             callback();
    //         });
    //     } else {
    //         callback();
    //     }
    // }

    // animate(state, callback) {
    //     callback = callback || function () {};
    //     this.sprite.setState(state);
    //     wait(this.sprite.getLength(), callback);
    // }

    // display() {
    //     this.sprite.icon.setOpacity(1);
    // }

    // hide() {
    //     this.sprite.icon.setOpacity(0);
    // }

    // activate() {
    //     this.active = true;
    // }

    // deactivate() {
    //     this.active = false;
    // }

    // isActive() {
    //     return this.active;
    // }

    // getLayer() {
    //     return this.layer;
    // }

    // getCoordinates() {
    //     return this.sprite.getCoordinates();
    // }

    // isOrientable() {
    //     return this.orientable;
    // }

    // setOrientation(coordinates) {
    //     if (this.isOrientable()) {
    //         this.sprite.setDirectionFromAngle(angle(this.coordinates, coordinates));
    //     }
    // }

    // getWithin(objects, distance) {
    //     let inside = [];
    //     let outside = [];
    //     for (let i = 0; i < objects.length; i++) {
    //         let obj = objects[i];
    //         if (within(this.getCoordinates(), obj.getCoordinates(), distance)) {
    //             inside.push(obj);
    //         } else {
    //             outside.push(obj);
    //         }
    //     }
    //     return [inside, outside];
    // }
}

export default Character;