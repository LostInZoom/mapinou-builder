import { LineString } from "ol/geom.js";

import Character from "./character.js";
import { Sprite } from "../cartography/sprite.js";
import { angle, project } from "../cartography/analysis.js";
import { getVectorContext } from "ol/render.js";
import { generateRandomInteger, weightedRandom } from "../utils/math.js";

class Rabbit extends Character {
    constructor(options) {
        super(options);

        this.colors = [ 'white', 'grey', 'brown', 'sand' ]
        this.color = options.color || 'white';

        if (this.color === 'random') {
            let i = generateRandomInteger(0, this.colors.length - 1);
            this.color = this.colors[i];
        }

        this.width = 64;
        this.height = 64;

        this.states = {
            idle: {
                north: { line: 9, length: 4 },
                east: { line: 10, length: 4 },
                south: { line: 8, length: 4 },
                west: { line: 11, length: 4 },
            },
            move: {
                north: { line: 1, length: 4 },
                east: { line: 2, length: 4 },
                south: { line: 0, length: 4 },
                west: { line: 3, length: 4 },
            },
            graze: {
                north: { line: 5, length: 4 },
                east: { line: 6, length: 4 },
                south: { line: 4, length: 4 },
                west: { line: 7, length: 4 },
            }
        }

        this.statespool = [ 'move', 'graze', 'idle' ];
        this.weights = [ 1, 2, 3 ];

        this.sprite = new Sprite({
            type: 'dynamic',
            layer: this.layer,
            src: `./assets/sprites/rabbit-${this.color}.png`,
            width: 64,
            height: 64,
            scale: .8,
            framerate: 200,
            coordinates: this.coordinates,
            anchor: [0.5, 0.8],
            states: this.states
        });
    }

    move(destination, callback) {
        callback = callback || function () {};

        this.sprite.setState('move');
        this.sprite.setDirectionFromAngle(angle(this.coordinates, destination));

        const line = new LineString([ this.coordinates, destination ]);
        const length = line.getLength();
        const speed = this.basemap.page.app.options.game.speed.roaming;
        const position = this.sprite.getGeometryClone();
        this.sprite.hide();

        let lastTime = Date.now();
        let distance = 0;

        this.layer.on('postrender', animate);

        let self = this;
        function animate(event) {
            const time = event.frameState.time;
            const context = getVectorContext(event);
            context.setStyle(self.sprite.style);

            const elapsed = (time - lastTime) / 1000;

            distance += speed * elapsed * self.basemap.view.getResolution();
            lastTime = time;

            // If the travelled distance is below the length of the route, continue the animation
            if (distance < length) {
                let coords = line.getCoordinateAt(distance / length);
                self.sprite.setCoordinates(coords);

                position.setCoordinates(coords);
                context.drawGeometry(position);
                self.basemap.map.render();
            }
            else {
                self.layer.un('postrender', animate);
                position.setCoordinates(destination);
                context.drawGeometry(position);

                self.sprite.setCoordinates(destination);
                self.sprite.display();

                callback();
            }
        }
    }
    
    getNextPoint() {
        let destination;
        if (this.options.roamingRadius) {
            destination = randomPointInCircle(this.coordinates, this.options.roamingRadius);
        } else {

        }
        return destination;
    }
}

class Roamer extends Rabbit {
    constructor(options) {
        super(options);
        this.setRandomDirection();
        this.roam();
    }

    setRandomDirection() {
        let pool = Object.keys(this.states.idle);
        let d = pool[pool.length * Math.random() | 0];
        this.sprite.setDirection(d);
    }

    roam() {
        if (generateRandomInteger(0, 4) === 4) {
            this.setRandomDirection();
        }

        let choice = weightedRandom(this.statespool, this.weights.slice());
        if (choice === 'move') {
            let e = this.basemap.container;
            let x = generateRandomInteger(0, e.offsetWidth);
            let y = generateRandomInteger(0, e.offsetHeight);
            let destination = this.basemap.map.getCoordinateFromPixel([x, y]);

            this.move(destination, () => {
                this.coordinates = destination;
                this.roam();
            });
        } else {
            this.animate(choice, () => {
                this.roam();
            })
        }
    }
}

export { Rabbit, Roamer };