import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Icon, Style } from 'ol/style';
import { easeInSine, easeOutSine, remap } from '../utils/math';
import { linear } from 'ol/easing';

class Sprite {
    constructor(options, callback) {
        this.options = options || {};
        callback = callback || function() {};

        this.type = options.type || 'dynamic;';
        this.coordinates = options.coordinates;
        this.originalScale = options.scale || 1;
        this.scale = options.scale || 1;
        this.feature = new Feature({ geometry: new Point(options.coordinates || null) });

        this.framerate = options.framerate || 100;
        this.loop = options.loop || true;
        this.states = options.states;
        this.state = options.state || 'idle';
        this.direction = options.direction || 'south';

        this.maxScale = options.maxScale || 1;
        this.minScale = options.minScale || 0.5;
        this.increment = options.increment || 0.05;

        this.spawnIncrement = options.spawnIncrement || 0.15;
        this.spawnFramerate = options.spawnFramerate || 50;

        this.options.layer.getSource().addFeature(this.feature);
        this.canvas = document.createElement('canvas');

        let width = this.canvas.width = options.width || 32;
        let height = this.canvas.height = options.height || 32;

        this.icon = new Icon({
            img: this.canvas,
            imgSize: [ width, height ],
            anchor: options.anchor || [0.5, 0.5],
            scale: options.scale || 1,
            opacity: 0
        });

        this.width = width;
        this.height = height;
        this.size = [ width, height ];
        this.currentSize = [ width, height ];
        this.shift = [ 0, 0 ];
        this.freezed = true;

        let img = this.icon.img_ = new Image();
        img.crossOrigin = options.crossOrigin || "anonymous";
        img.src = options.src;
        this.style = new Style({
            image: this.icon
        });
        
        this.feature.setStyle(this.style);
        this.image = img;

        if (this.type === 'dynamic') {
            this.offset = [ 0, this.states[this.state].line * this.size[1] ];
        } else {
            this.offset = options.offset || [ 0, 0 ];
        }

        this.image.addEventListener('load', () => {
            this.draw();
            callback();
        }, { once: true });
    }

    makeDynamic(options) {
        this.cancelScaleAnimation();
        
        this.framerate = options.framerate || 100;
        this.states = options.states;
        this.state = options.state || 'idle';
        this.direction = options.direction || 'south';

        if (options.loop !== undefined) { this.loop = options.loop } else { this.loop = true; }
        if (options.src) { this.icon.img_.src = options.src; }
        if (options.width) { this.width = options.width; }
        if (options.height) { this.height = options.height; }
        if (options.scale) {
            this.icon.setScale(options.scale);
            this.feature.setStyle(this.style);
        }

        this.offset = [ 0, this.states[this.state][this.direction].line*this.height ];

        this.type = 'dynamic';
        this.animate(() => {
            this.hide();
        });
    }

    spawn(callback) {
        callback = callback || function() {};
        let goal = this.scale;
        this.setScale(0);
        this.icon.setOpacity(1);
        this.animateScale(goal * 1.2, easeInSine, this.spawnIncrement, this.spawnFramerate, () => {
            this.animateScale(goal, easeOutSine, this.spawnIncrement, this.spawnFramerate, () => {
                callback();
            });
        });
    }

    despawn(callback) {
        callback = callback || function() {};
        this.cancelScaleAnimation();
        let goal = this.scale;
        this.animateScale(goal * 1.2, easeOutSine, this.spawnIncrement, this.spawnFramerate, () => {
            this.animateScale(0, easeInSine, this.spawnIncrement, this.spawnFramerate, () => {
                this.freeze();
                callback();
            });
        });
    }

    draw() {
        var ctx = this.icon.getImage().getContext("2d");
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.drawImage(
            this.icon.img_, this.offset[0], this.offset[1], this.size[0], this.size[1],
            this.shift[0], this.shift[1], this.currentSize[0], this.currentSize[1]
        );
        this.options.layer.values_.map.render();
    }

    getGeometryClone() {
        return this.feature.getGeometry().clone();
    }

    setCoordinates(coords) {
        this.coordinates = coords;
        if (this.feature.getGeometry()) { this.feature.getGeometry().setCoordinates(coords); }
    }

    getOpacity() {
        return this.icon.getOpacity();
    }

    setOpacity(opacity) {
        this.icon.setOpacity(opacity);
    }

    getCoordinates() {
        return this.coordinates;
    }

    display() {
        this.feature.setGeometry(new Point(this.coordinates));
    }

    hide() {
        this.feature.setGeometry(null);
    }

    setDirectionFromAngle(angle) {
        if (angle >= Math.PI/4 && angle <= 3*Math.PI/4) { this.direction = 'north'; }
        else if (angle > 3*Math.PI/4 && angle < 5*Math.PI/4) { this.direction = 'west'; }
        else if (angle >= 5*Math.PI/4 && angle <= 7*Math.PI/4) { this.direction = 'south'; }
        else { this.direction = 'east'; }
    }

    setDirection(direction) {
        this.direction = direction;
    }

    getDirection() {
        return this.direction;
    }

    setState(state) {
        this.state = state;
        this.pos = 1;
        this.draw();
    }

    getState() {
        return this.state;
    }

    getFramerate() {
        return this.framerate;
    }

    getLength() {
        let d = this.getDirection();
        let frameNumber = this.states.graze[d].length;
        return frameNumber * this.getFramerate();
    }

    /**
     * Animate the sprite with the current frames.
     * @param {function} callback 
     */
    animate(callback) {
        callback = callback || function () {};
        this.freezed = false;
        this.pos = 1;
        this.animation = setInterval(() => {
            let state = this.states[this.state][this.direction];
            let last = false;
            if (this.pos == state.length) { this.pos = 1; last = true; }
            else { ++this.pos; }
            this.offset = [ (this.pos - 1)*this.width, state.line*this.height ]

            if (last && !this.loop) {
                this.freeze();
                callback();
            } else {
                this.draw();
            }
        }, this.framerate);
    }

    freeze() {
        if (this.animation) {
            clearInterval(this.animation);
            this.freezed = true;
        }
    }

    isFreezed() {
        return this.freezed;
    }

    breathe(value1, value2) {
        this.animateScale(value1, linear, 0.05, 50, () => {
            this.animateScale(value2, linear, 0.05, 50, () => {
                this.breathe(value1, value2);
            });
        });
    }

    cancelScaleAnimation() {
        if (this.scaleAnimation) {
            clearInterval(this.scaleAnimation);
        }
    }

    animateScale(value, easing, increment, framerate, callback) {
        callback = callback || function () {};
        let scale = this.scale;
        if (scale !== value) {
            let inflate = scale < value ? true : false;
            this.scaleAnimation = setInterval(() => {
                if (inflate) { scale += increment } else { scale -= increment }
                let done = false;
                if (inflate && scale >= value) { done = true; }
                if (!inflate && scale <= value) { done = true; }
                if (done) {
                    this.setScale(value);
                    clearInterval(this.scaleAnimation);
                    callback();
                } else {
                    // Remap the scale value, from [min, max] to [0, 1]
                    let max = Math.max(scale, value);
                    let min = Math.min(scale, value);
                    let remapped = remap(scale, min, max);
                    // Calculate the remapped easing out cubic value
                    let eased = easing(remap(remapped, 0, 1, min, max));
                    this.setScale(eased);
                }
            }, framerate);
        }
    }

    /**
     * Change the scale of the sprite.
     * @param {int} scale - New scale to apply
     */
    setScale(scale) {
        this.currentSize = [ this.width * scale, this.height * scale ];
        this.shift = [ (this.width - this.currentSize[0]) / 2, (this.height - this.currentSize[1]) / 2 ];
        this.scale = scale;
        this.draw();
    }

    getScale() {
        return this.scale;
    }

    restoreScale() {
        this.setScale(this.originalScale);
    }
}

export  default Sprite;