import { LineString } from "ol/geom.js";
import { getVectorContext } from "ol/render.js";

import { angle, randomPointInCircle } from "../cartography/analysis.js";
import { generateRandomInteger, weightedRandom } from "../utils/math.js";
import Rabbit from "./rabbit.js";

class Roamer extends Rabbit {
    constructor(options) {
        super(options);
        this.setRandomDirection();
    }

    setRandomDirection() {
        let pool = Object.keys(this.states.idle);
        let d = pool[pool.length * Math.random() | 0];
        this.sprite.setDirection(d);
    }

    roam() {
        if (this.active) {
            if (generateRandomInteger(0, 4) === 4) { this.setRandomDirection(); }
            let choice = weightedRandom(this.statespool, this.weights.slice());

            if (choice === 'move') {
                let destination;
                if (this.target) {
                    destination = randomPointInCircle(this.origin, this.radius);
                } else {
                    let e = this.basemap.container;
                    let x = generateRandomInteger(0, e.offsetWidth - this.sprite.width);
                    let y = generateRandomInteger(0, e.offsetHeight - this.sprite.height);
                    destination = this.basemap.map.getCoordinateFromPixel([x, y]);
                }

                this.travel(destination, () => {
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

    travel(destination, callback) {
        callback = callback || function () {};

        this.sprite.setState('move');
        this.sprite.setDirectionFromAngle(angle(this.coordinates, destination));

        const line = new LineString([ this.coordinates, destination ]);
        const length = line.getLength();
        const speed = this.speed;
        const position = this.sprite.getGeometryClone();
        this.sprite.removeGeometry();

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
                self.sprite.resetGeometry();

                callback();
            }
        }
    }
}

export default Roamer;