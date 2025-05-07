import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Icon, Style } from 'ol/style';

class Sprite {
    constructor(options) {
        this.options = options || {};
        this.imgscale = options.scale || 1;
        this.framerate = options.framerate || 100;
        this.feature = new Feature({ geometry: new Point(options.coordinates || null) });
        this.options.layer.getSource().addFeature(this.feature);
        let canvas = document.createElement('canvas');
        let width = canvas.width = options.width || 32;
        let height = canvas.height = options.height || 32;
        this.icon = new Icon({
            img: canvas,
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

    setGeometry(geometry) {
        this.feature.setGeometry(geometry);
    }

    setCoordinates(coords) {
        this.feature.getGeometry().setCoordinates(coords);
    }

    getCoordinates() {
        return this.options.coordinates;
    }
}

class DynamicSprite extends Sprite {
    constructor(options) {
        super(options);
        this.states = options.states;

        this.state = options.state || 'idle';
        this.direction = options.direction || 'south';
        
        this.offset = [ 0, this.states[this.state].line*this.height ];

        this.image.addEventListener('load', () => {
            this.animate();
        }, { once: true });
    }

    animate() {
        this.pos = 1;
        this.interval = setInterval(() => {
            let state = this.states[this.state][this.direction];
            if (this.pos == state.length) { this.pos = 1; }
            else { ++this.pos; }
            this.offset = [ (this.pos - 1)*this.width, state.line*this.height ]
            this.draw();
        }, this.framerate);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    setDirection(angle) {
        if (angle >= Math.PI/4 && angle <= 3*Math.PI/4) { this.direction = 'north'; }
        else if (angle > 3*Math.PI/4 && angle < 5*Math.PI/4) { this.direction = 'west'; }
        else if (angle >= 5*Math.PI/4 && angle <= 7*Math.PI/4) { this.direction = 'south'; }
        else { this.direction = 'east'; }
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
}

class StaticSprite extends Sprite {
    constructor(options) {
        super(options);
        this.offset = options.offset || [ 0, 0 ];
        this.image.addEventListener('load', () => {
            this.draw();
            this.animate();
        }, { once: true });
    }

    animate() {
        let increment = 0.1;
        let scale = this.imgscale;
        this.interval = setInterval(() => {
            scale += increment;
            if (scale > 2) { increment = -0.1; }
            else if (scale < 0.8) { increment = 0.1; }
        }, this.framerate);
    }
}

export { StaticSprite, DynamicSprite }