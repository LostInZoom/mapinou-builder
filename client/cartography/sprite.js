import { Feature } from 'ol';
import { Point } from 'ol/geom';
import { Icon, Style } from 'ol/style';

class Sprite {
    constructor(options) {
        this.options = options || {};
        if (options.states) { this.states = options.states; }

        this.feature = new Feature({
            type: 'player',
            geometry: new Point(options.coordinates || null)
        });
        this.options.layer.getSource().addFeature(this.feature);

        let canvas = document.createElement('canvas');
        let size = canvas.width = canvas.height = options.size || 32;

        this.icon = new Icon({
            img: canvas,
            imgSize: [size, size],
            scale: options.scale || 1,
            opacity: 0
        });

        this.size = size;
        this.offset = [ 0, this.states.idle.line*this.size ]
        
        let img = this.icon.img_ = new Image();
        img.crossOrigin = options.crossOrigin || "anonymous";
        img.src = options.src;

        this.style = new Style({
            image: this.icon
        });
        this.feature.setStyle(this.style);

        this.image = img;
        this.image.addEventListener('load', () => {
            this.draw();
        }, { once: true });

        this.framerate = options.framerate || 100;
        this.state = 'idle';
        this.direction = '';
        this.pos = 1;
        this.interval = setInterval(() => {
            let state = this.state == 'idle' ? this.state : this.state + this.direction;
            if (this.pos == this.states[state].length) { this.pos = 1; }
            else { ++this.pos; }
            this.offset = [ (this.pos - 1)*this.size, this.states[state].line*this.size ]
            this.draw();
        }, this.framerate);
    }

    draw() {
        var ctx = this.icon.getImage().getContext("2d");
        ctx.clearRect(0, 0, this.size, this.size);
        ctx.drawImage(this.icon.img_, this.offset[0], this.offset[1], this.size, this.size, 0, 0, this.size, this.size);
        this.options.layer.values_.map.render();
    }

    setDirection(angle) {
        if (angle >= Math.PI/4 && angle <= 3*Math.PI/4) {
            this.direction = 'N';
        }
        else if (angle > 3*Math.PI/4 && angle < 5*Math.PI/4) {
            this.direction = 'W';
        }
        else if (angle >= 5*Math.PI/4 && angle <= 7*Math.PI/4) {
            this.direction = 'S';
        }
        else {
            this.direction = 'E';
        }
    }

    setState(state) {
        this.state = state;
        this.draw();
    }

    getState() {
        return this.state;
    }

    getGeometryClone() {
        return this.feature.getGeometry().clone();
    }

    setGeometry(geometry) {
        this.feature.setGeometry(geometry);
    }

    setCoordinates(coords) {
        this.feature.coords = coords;
    }
}

Sprite.prototype.states = {
    idle: { line: 2, length: 3 },
    moveW: { line: 0, length: 3 },
    moveN: { line: 1, length: 3 },
    moveS: { line: 2, length: 3 },
    moveE: { line: 3, length: 3 },
    walkW: { line: 4, length: 3 },
    walkN: { line: 5, length: 3 },
    walkS: { line: 6, length: 3 },
    walkE: { line: 7, length: 3 },
};

export { Sprite }