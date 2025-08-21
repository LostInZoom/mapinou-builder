import * as turf from '@turf/turf';

import { angle, randomPointInCircle } from "../cartography/analysis.js";
import { generateRandomInteger, weightedRandom } from "../utils/math.js";
import Rabbit from "./rabbit.js";
import { wait } from "../utils/dom.js";

class Roamer extends Rabbit {
    constructor(options) {
        super(options);
        this.setRandomOrientation();
    }

    roam() {
        this.setFrame(0);
        if (this.active) {
            if (generateRandomInteger(0, 4) === 4) { this.setRandomOrientation(); }
            let choice = weightedRandom(this.statespool, this.weights.slice());

            if (choice === 'move') {
                let destination;
                if (this.target) {
                    destination = randomPointInCircle(this.origin, this.radius);
                } else {
                    let e = this.layer.basemap.getContainer();
                    let x = generateRandomInteger(0, e.offsetWidth - this.size);
                    let y = generateRandomInteger(0, e.offsetHeight - this.size);
                    destination = this.layer.basemap.getCoordinatesAtPixel([x, y]);
                }

                this.travel(destination, () => {
                    this.setCoordinates(destination);
                    this.roam();
                });
            } else {
                this.setState(choice);
                wait(4 * this.framerate, () => {
                    this.roam();
                });
            }
        }
    }

    travel(destination, callback) {
        callback = callback || function () { };

        if (this.active) {
            this.setState('move');
            this.setOrientationFromAngle(angle(this.coordinates, destination));

            const line = turf.lineString([this.coordinates, destination]);
            const length = turf.length(line, { units: 'meters' });

            let distance = 0;
            let lastTime = performance.now();

            const animation = (time) => {
                if (this.active) {
                    let elapsed = (time - lastTime) / 1000;
                    if (elapsed < 0) { elapsed = 0; }
                    distance += this.speed * elapsed * this.layer.basemap.getResolution();

                    lastTime = time;
                    if (distance < length) {
                        if (distance > 0) {
                            let coords = turf.along(line, distance, { units: 'meters' }).geometry.coordinates;
                            this.setCoordinates(coords);
                        }
                        requestAnimationFrame(animation);
                    }
                    else {
                        this.setCoordinates(destination);
                        callback();
                    }
                }
            };
            requestAnimationFrame(animation);
        }
    }
}

export default Roamer;