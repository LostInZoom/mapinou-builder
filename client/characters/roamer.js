import { LineString } from "ol/geom.js";
import { getVectorContext } from "ol/render.js";

import { angle, randomPointInCircle } from "../cartography/analysis.js";
import { generateRandomInteger, weightedRandom } from "../utils/math.js";
import Rabbit from "./rabbit.js";
import { unByKey } from "ol/Observable.js";
import { wait } from "../utils/dom.js";

class Roamer extends Rabbit {
    constructor(options) {
        super(options);
        this.setRandomDirection();
        this.animateFrame();
    }

    setRandomDirection() {
        let pool = Object.keys(this.states.idle);
        let d = pool[pool.length * Math.random() | 0];
        this.setDirection(d);
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
                    let e = this.layer.basemap.container;
                    let x = generateRandomInteger(0, e.offsetWidth - this.frameSize);
                    let y = generateRandomInteger(0, e.offsetHeight - this.frameSize);
                    destination = this.layer.basemap.map.getCoordinateFromPixel([x, y]);
                }

                this.travel(destination, () => {
                    this.coordinates = destination;
                    this.roam();
                });
            } else {
                this.setState(choice);
                wait(this.getAnimationDuration(), () => {
                    this.roam();
                });
            }
        }
    }

    travel(destination, callback) {
        callback = callback || function () {};
        this.setState('move');
        this.setDirectionFromAngle(angle(this.coordinates, destination));
        const line = new LineString([ this.coordinates, destination ]);
        const length = line.getLength();
        const speed = this.speed;
        let distance = 0;
        let lastTime = performance.now();
        const animation = (time) => {
            let elapsed = (time - lastTime) / 1000;
            distance += speed * elapsed * this.layer.basemap.getResolution();
            lastTime = time;
            // If the travelled distance is below the length of the route, continue the animation
            if (distance < length) {
                this.setCoordinates(line.getCoordinateAt(distance / length));
                requestAnimationFrame(animation);
            }
            else {
                unByKey(this.listener);
                this.setCoordinates(destination);
                callback();
            }
        };
        requestAnimationFrame(animation);
    }
}

export default Roamer;