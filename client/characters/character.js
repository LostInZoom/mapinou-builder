import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import { angle, within } from "../cartography/analysis.js";
import { wait } from "../utils/dom.js";
import { unByKey } from "ol/Observable.js";
import { Feature } from "ol";
import { Point } from "ol/geom.js";
import { easeInCubic, easeInQuint, easeOutCubic, easeOutQuint } from "../utils/math.js";

/**
 * Base class to create a new character on the map.
 */
class Character {
    constructor(options) {
        this.options = options || {};

        this.layer = this.options.layer;
        this.app = this.layer.basemap.app;
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
        this.start = 0;
        this.startFrameAnimation = 0;
        this.startScaleAnimation = 0;
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

    getId() {
        return this.id;
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    isActive() {
        return this.active;
    }

    destroy() {
        this.active = false;
        this.stopAnimations();
        this.layer.removeCharacter(this);
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
        angle = (angle + 2 * Math.PI) % (2 * Math.PI);
        if (angle >= Math.PI / 4 && angle < 3 * Math.PI / 4) {
            this.setOrientation('north');
        } else if (angle >= 3 * Math.PI / 4 && angle < 5 * Math.PI / 4) {
            this.setOrientation('west');
        } else if (angle >= 5 * Math.PI / 4 && angle < 7 * Math.PI / 4) {
            this.setOrientation('south');
        } else {
            this.setOrientation('east');
        }
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

    stopAnimations() {
        this.stop();
        this.stopFrameAnimation();
        this.stopScaleAnimation();
    }

    stop() {
        this.start = 0;
    }

    stopFrameAnimation() {
        this.startFrameAnimation = 0;
    }

    animateFrame(callback) {
        this.startFrameAnimation = performance.now();
        let start = this.startFrameAnimation;
        const animation = () => {
            wait(this.framerate, () => {
                if (start === this.startFrameAnimation) {
                    this.setFrame((this.frame + 1) % this.framenumber);
                    if (this.getFrame() === (this.framenumber - 1) && typeof callback === 'function') {
                        callback();
                    } else {
                        requestAnimationFrame(animation);
                    }
                }
            });
        };
        requestAnimationFrame(animation);
    }

    spawn(callback) {
        callback = callback || function () { };
        this.animateScale({
            value: this.framescale,
            overshoot: 1.1
        }, callback);
    }

    despawn(callback) {
        callback = callback || function () { };
        this.animateScale({
            value: 0,
            overshoot: 1.1
        }, callback);
    }

    getSpawnDuration() {
        return this.spawnDuration;
    }

    stopScaleAnimation() {
        this.startScaleAnimation = 0;
    }

    breathe() {
        this.startScaleAnimation = performance.now();
        let start = this.startScaleAnimation;

        // Sinusoidal function to animate the scale
        const base = 0.95;
        const amplitude = 0.15;
        const period = 1000;
        const animate = (time) => {
            if (start === this.startScaleAnimation) {
                const t = (time % period) / period;
                const scale = base + amplitude * Math.sin(t * Math.PI * 2);
                this.setScale(scale);
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }

    animateScale(options, callback) {
        callback = callback || function () { };
        this.startScaleAnimation = performance.now();
        const start = this.startScaleAnimation;

        const origin = this.scale;
        const value = options.value;
        const duration = options.duration || (this.spawnDuration || 300);
        const k = (options.overshoot == null) ? 1 : options.overshoot; // facteur >= 1
        const easing = options.easing || (t => t);
        const minScale = (options.minScale != null) ? options.minScale : 0;
        const maxScale = (options.maxScale != null) ? options.maxScale : Infinity;

        const st = performance.now();
        const lerp = (a, b, u) => a + (b - a) * u;

        const animation = (time) => {
            if (start === this.startScaleAnimation) {
                const t = Math.min(Math.max((time - st) / duration, 0), 1);
                let s;
                if (k <= 1 || origin === value) {
                    // No overshoot
                    s = lerp(origin, value, easing(t));
                } else {
                    // Get the overshoot target
                    let overshootTarget;
                    if (origin < value) {
                        // spawn, overshoot based on final value
                        overshootTarget = value * k;
                    } else {
                        // despawn, overshoot based on origin value
                        overshootTarget = origin * k;
                    }

                    // phase 1 : origin -> overshootTarget (t in [0,0.5])
                    // phase 2 : overshootTarget -> value (t in (0.5,1])
                    if (t < 0.5) {
                        const u = easing(t / 0.5);
                        s = lerp(origin, overshootTarget, u);
                    } else {
                        const u = easing((t - 0.5) / 0.5);
                        s = lerp(overshootTarget, value, u);
                    }
                }

                // clamp to avoid negative value
                s = Math.max(minScale, Math.min(maxScale, s));

                this.setScale(s);

                if (t < 1) {
                    requestAnimationFrame(animation);
                } else {
                    this.setScale(Math.max(minScale, Math.min(maxScale, value)));
                    callback();
                }
            };
        };
        requestAnimationFrame(animation);
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