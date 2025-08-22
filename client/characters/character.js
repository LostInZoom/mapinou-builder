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
        this.orientations = ['north', 'south', 'east', 'west'];

        this.id = this.options.id || this.generateUniqueId();

        this.loop = this.loop !== undefined ? this.loop : true;
        this.coordinates = this.options.coordinates;
        this.origin = this.options.coordinates;
        this.zIndex = this.options.zIndex || 1;
        this.spawnDuration = this.options.spawnDuration || 300;

        this.active = true;
        this.destroyed = false;
        this.animate = false;
        this.moving = false;

        this.frame = this.options.frame || 0;
        this.framerate = this.options.framerate || 200;
        this.framescale = this.options.scale || 1;
        this.framenumber = this.options.framenumber || 1;
        // Set the scale to zero because the character need to be spawned
        this.scale = 0;
        this.offset = [0, 0];

        this.feature = {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: this.coordinates
            },
            properties: {
                id: this.id
            }
        };
    }

    generateUniqueId() {
        let id;
        do { id = crypto.randomUUID(); }
        while (this.layer.getFeatures().some(c => c.properties.id === id));
        return id;
    }

    destroy() {
        this.active = false;
        this.layer.removeCharacter(this);
    }

    getId() {
        return this.id;
    }

    getFeature() {
        return this.feature;
    }

    getState() {
        return this.state;
    }

    setState(state) {
        this.state = state;
        this.feature.properties.state = state;
        this.layer.updateSource();
    }

    getOrientation() {
        return this.orientation;
    }

    setOrientation(orientation) {
        this.orientation = orientation;
        this.feature.properties.orientation = orientation;
        this.layer.updateSource();
    }

    setOrientationFromAngle(angle) {
        if (angle >= Math.PI / 4 && angle <= 3 * Math.PI / 4) { this.setOrientation('north'); }
        else if (angle > 3 * Math.PI / 4 && angle < 5 * Math.PI / 4) { this.setOrientation('west'); }
        else if (angle >= 5 * Math.PI / 4 && angle <= 7 * Math.PI / 4) { this.setOrientation('south'); }
        else { this.setOrientation('east'); }
    }

    setOrientationFromCoordinates(coordinates) {
        if (this.orientable) {
            this.setOrientationFromAngle(angle(this.coordinates, coordinates));
        }
    }

    setRandomOrientation() {
        let o = this.orientations[this.orientations.length * Math.random() | 0];
        this.setOrientation(o);
    }

    getFrame() {
        return this.frame;
    }

    setFrame(frame) {
        this.frame = frame;
        this.feature.properties.frame = frame;
        this.layer.updateSource();
    }

    getScale() {
        return this.scale;
    }

    setScale(scale) {
        this.scale = scale;
        this.feature.properties.scale = scale;
        this.layer.updateSource();
    }

    getCoordinates() {
        return this.coordinates;
    }

    setCoordinates(coordinates) {
        this.coordinates = coordinates;
        this.feature.geometry.coordinates = coordinates;
        this.layer.updateSource();
    }

    animateFrame() {
        if (this.active) {
            wait(this.framerate, () => {
                this.setFrame((this.frame + 1) % this.framenumber);
                requestAnimationFrame(() => {
                    this.animateFrame();
                });
            });
        }
    }

    spawn(callback) {
        callback = callback || function () { };
        this.animateScale({
            value: this.framescale,
            duration: this.spawnDuration,
            easing: easeOutCubic
        }, callback);
    }

    despawn(callback) {
        callback = callback || function () { };
        this.animateScale({
            value: 0,
            duration: this.spawnDuration,
            easing: easeInCubic,
        }, callback);
    }

    getSpawnDuration() {
        return this.spawnDuration;
    }

    animateScale(options, callback) {
        callback = callback || function () { };

        if (this.active) {
            const origin = this.scale;
            const value = options.value;
            const duration = options.duration || 200;
            const overshoot = options.overshoot || 1.1;
            const easing = options.easing || linear;
            let overshootRatio = options.overshootRatio || 0.7;
            overshootRatio = Math.max(0.01, Math.min(0.99, overshootRatio));

            const start = performance.now();
            const animation = (time) => {
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

                this.setScale(scale);

                if (t < 1) {
                    requestAnimationFrame(animation);
                } else {
                    this.setScale(value);
                    callback();
                }
            };

            requestAnimationFrame(animation);
        }
    }














    // getFeature() {
    //     return this.feature;
    // }

    // getCoordinates() {
    //     return this.feature.getGeometry().getCoordinates();
    // }

    // setCoordinates(coordinates) {
    //     this.coordinates = coordinates;
    //     return this.feature.getGeometry().setCoordinates(coordinates);
    // }

    // getSpawnDuration() {
    //     return this.spawnDuration;
    // }

    // getDirection() {
    //     if (this.orientable) {
    //         return this.frameDirection;
    //     } else {
    //         return undefined;
    //     }
    // }

    // setDirection(direction) {
    //     if (this.orientable) {
    //         this.frameDirection = direction;
    //         this.updateOffset();
    //     }
    // }

    // setDirectionFromAngle(angle) {
    //     if (angle >= Math.PI / 4 && angle <= 3 * Math.PI / 4) { this.setDirection('north'); }
    //     else if (angle > 3 * Math.PI / 4 && angle < 5 * Math.PI / 4) { this.setDirection('west'); }
    //     else if (angle >= 5 * Math.PI / 4 && angle <= 7 * Math.PI / 4) { this.setDirection('south'); }
    //     else { this.setDirection('east'); }
    // }

    // isOrientable() {
    //     return this.orientable;
    // }

    // setOrientation(coordinates) {
    //     if (this.isOrientable()) {
    //         this.setDirectionFromAngle(angle(this.coordinates, coordinates));
    //     }
    // }

    // getState() {
    //     return this.state;
    // }

    // setState(state) {
    //     this.state = state;
    //     this.framePosition = 0;
    //     this.updateOffset();
    // }

    // getFrameRate() {
    //     return this.frameRate;
    // }

    // getAnimationDuration() {
    //     if (this.orientable) { return this.states[this.state][this.frameDirection].length * this.frameRate; }
    //     else { return this.states[this.state].length * this.frameRate; }
    // }

    // getOffset() {
    //     return this.offset;
    // }

    // updateOffset() {
    //     requestAnimationFrame(() => {
    //         let l;
    //         if (this.orientable) { l = this.states[this.state][this.frameDirection].line; }
    //         else { l = this.states[this.state].line; }
    //         let x = this.frameSize * this.framePosition;
    //         let y = this.frameSize * l;
    //         if (this.colorsPosition) { y += (this.colorsPosition.indexOf(this.color) * this.sheetSize) }
    //         if (this.frameOffset) { y += this.frameOffset }
    //         this.offset = [x, y];
    //         this.feature.set('offset', [x, y]);
    //     });
    // }

    // spawn(callback) {
    //     callback = callback || function () { };
    //     this.feature.set('scale', [0, 0]);
    //     this.animateScale({
    //         value: this.frameScale,
    //         duration: this.spawnDuration,
    //         easing: easeOutCubic
    //     }, callback);
    // }

    // despawn(callback) {
    //     callback = callback || function () { };
    //     this.animateScale({
    //         value: 0,
    //         duration: this.spawnDuration,
    //         easing: easeInCubic,
    //     }, callback);
    // }

    // destroy() {
    //     this.layer.removeCharacter(this);
    //     this.destroyed = true;
    // }

    // animateFrame(callback) {
    //     this.animate = true;
    //     const animation = () => {
    //         if (this.animate) {
    //             wait(this.frameRate, () => {
    //                 if (!this.destroyed) {
    //                     let finish = true;
    //                     let state;
    //                     if (this.orientable) { state = this.states[this.state][this.frameDirection]; }
    //                     else { state = this.states[this.state]; }

    //                     if (this.framePosition === state.length - 1) {
    //                         if (callback !== undefined) {
    //                             finish = false;
    //                             this.animate = false;
    //                             callback();
    //                         } else {
    //                             this.framePosition = 0;
    //                         }
    //                     }
    //                     else {
    //                         ++this.framePosition;
    //                     }

    //                     if (finish) {
    //                         this.offset[0] = this.frameSize * this.framePosition;
    //                         this.feature.set('offset', [this.offset[0], this.offset[1]]);
    //                         this.setCoordinates(this.coordinates);
    //                         this.layer.changed();
    //                         requestAnimationFrame(animation);
    //                     }
    //                 }
    //             });
    //         }
    //     }
    //     requestAnimationFrame(animation);
    // }

    // stopFrameAnimation() {
    //     this.animate = false;
    // }











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