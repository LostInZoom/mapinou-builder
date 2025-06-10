import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Icon, Style } from 'ol/style';

class Sprite {
    constructor(options) {
        this.options = options || {};
        this.type = options.type || 'static';

        this.coordinates = options.coordinates;
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

        let img = this.icon.img_ = new Image();
        img.crossOrigin = options.crossOrigin || "anonymous";
        img.src = options.src;
        this.style = new Style({
            image: this.icon
        });
        
        this.feature.setStyle(this.style);
        this.image = img;

        switch (this.type) {
            case 'dynamic':
                this.offset = [ 0, this.states[this.state].line*this.height ];
                break;
            default:
                this.offset = options.offset || [ 0, 0 ];
                break;
        }

        this.image.addEventListener('load', () => {
            this.draw();
            switch (this.type) {
                case 'dynamic':
                    this.animate();
                    break;
                default:
                    this.animateScale();
                    break;
            }
        }, { once: true });
    }

    makeDynamic(options) {
        this.freezeScale();
        
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

    draw() {
        var ctx = this.icon.getImage().getContext("2d");
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.drawImage(this.icon.img_, this.offset[0], this.offset[1], this.width, this.height, 0, 0, this.width, this.height);
        this.options.layer.values_.map.render();
    }

    getGeometryClone() {
        return this.feature.getGeometry().clone();
    }

    setCoordinates(coords) {
        this.coordinates = coords;
        if (this.feature.getGeometry()) { this.feature.getGeometry().setCoordinates(coords); }
    }

    getCoordinates() {
        return this.coordinates;
    }

    hide() {
        this.feature.setGeometry(null);
    }

    display() {
        this.feature.setGeometry(new Point(this.coordinates));
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

    animate(callback) {
        callback = callback || function () {};
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
        }
    }

    animateScale() {
        let scale = this.scale;
        let i = this.increment;
        this.scaleAnimation = setInterval(() => {
            scale += i;
            if (scale > this.maxScale) { i = -this.increment; }
            else if (scale < this.minScale) { i = this.increment; }
            this.setScale(scale);
        }, this.framerate);
    }

    freezeScale() {
        if (this.scaleAnimation) {
            clearInterval(this.scaleAnimation);
            this.setScale(this.scale);
        }
    }

    setScale(scale) {
        var ctx = this.icon.getImage().getContext("2d");
        ctx.clearRect(0, 0, this.width, this.height);
        let wfactor = this.width * scale;
        let hfactor = this.height * scale;
        let wo = (this.width - wfactor) / 2;
        let ho = (this.height - hfactor) / 2;
        ctx.drawImage(
            this.icon.img_, this.offset[0], this.offset[1], this.width, this.height,
            wo, ho, wfactor, hfactor
        );
        this.options.layer.values_.map.render();
    }
}

export { Sprite }