import * as turf from "@turf/turf";

import { LineString } from "ol/geom.js";

import { angle, project, within } from "../cartography/analysis.js";
import { getVectorContext } from "ol/render.js";
import Rabbit from "./rabbit.js";
import { unByKey } from "ol/Observable.js";
import Router from "../cartography/routing.js";
import Flower from "./flower.js";
import { wait } from "../utils/dom.js";

class Player extends Rabbit {
    constructor(options) {
        super(options);
        this.level = options.level;

        // Routing infos
        this.router = new Router({ position: this.coordinates });

        this.destination = undefined;
        this.traveling = false;

        this.distance = 0;
        this.position = this.coordinates;

        this.closeEnemies = [];
        this.flowers = [];

        this.invulnerable = false;
    }

    isInvulnerable() {
        return this.invulnerable;
    }

    makeInvulnerable(duration) {
        this.invulnerable = true;
        wait(duration, () => {
            this.invulnerable = false;
        });
    }

    stop() {
        if (this.flowers.length > 0) {
            this.flowers.shift().decay();
        }
        // Increment the traveled distance
        this.travelled += this.distance;

        // Set router position
        this.router.setPosition(this.getCoordinates());
        this.setState('idle');

        this.level.deactivateMovementButton();
        this.level.score.setState('default');

        this.traveling = false;
    }

    move(route, callback) {
        callback = callback || function () { };

        // Set routing button to moving mode
        this.level.moving();
        // Set the sprite to moving state
        this.setState('move');

        // Retrieve the vertexes composing the calculated route
        let vertexes = route.geometry.coordinates;
        const destination = vertexes[vertexes.length - 1];

        let flower = new Flower({
            level: this.level,
            layer: this.layer.basemap.flowers,
            coordinates: destination
        });
        this.flowers.push(flower);

        // Create the path line and calculate its length
        const line = turf.lineString(vertexes);
        const length = turf.length(line, { units: 'meters' });

        // Retrieve the time
        let lastTime = performance.now();

        // Get the speed in meters/second
        const speed = this.params.game.speed.travel / 3.6;

        // Change the direction of the sprite according to its current movement
        let a = angle(vertexes[0], vertexes[1]);
        this.setOrientationFromAngle(a);

        // Start the distance counter
        this.distance = 0;

        // index du segment courant
        let segmentIndex = 0;
        let segmentStart = vertexes[0];
        let segmentEnd = vertexes[1];

        // longueur de ce segment
        let segmentLine = turf.lineString([segmentStart, segmentEnd]);
        let segmentLength = turf.length(segmentLine, { units: 'meters' });

        // orientation fixe pour ce segment
        this.setOrientationFromAngle(angle(segmentStart, segmentEnd));

        const animation = (time) => {
            // Calculate the elapsed time in seconds
            const elapsed = (time - lastTime) / 1000;
            // Calculate the distance traveled depending on the elapsed time and the speed
            this.distance = this.distance + (elapsed * speed);
            // Set the previous time as the current one
            lastTime = time;

            // If the travelled distance is below the length of the route, continue the animation
            if (this.distance <= length) {
                if (this.distance > 0) {
                    // Calculate the position of the point along the route line
                    this.position = turf.along(line, this.distance, { units: 'meters' }).geometry.coordinates;

                    // distance parcourue dans le segment actuel
                    const segmentTraveled = turf.distance(segmentStart, this.position, { units: 'meters' });

                    // si on a dépassé la fin du segment -> passer au suivant
                    if (segmentTraveled >= segmentLength && segmentIndex < vertexes.length - 2) {
                        segmentIndex++;
                        segmentStart = vertexes[segmentIndex];
                        segmentEnd = vertexes[segmentIndex + 1];
                        segmentLine = turf.lineString([segmentStart, segmentEnd]);
                        segmentLength = turf.length(segmentLine, { units: 'meters' });
                        this.setOrientationFromAngle(angle(segmentStart, segmentEnd));
                    }

                    // this.setOrientationFromAngle(angle(this.getCoordinates(), this.position));

                    // this.layer.basemap.helpers.handle(this.getCoordinates());
                    // this.layer.basemap.enemies.handle(this.getCoordinates());

                    this.setCoordinates(this.position);
                    // If target is in range, win the level
                    if (within(this.position, this.layer.basemap.target.getCoordinates(), this.params.game.tolerance.target)) {
                        this.stop();
                        callback(true);
                    }
                }
                requestAnimationFrame(animation);
            }
            else {
                this.setCoordinates(vertexes[vertexes.length - 1]);
                this.stop();
                callback();
            }
        };
        requestAnimationFrame(animation);
    }

    travel(destination, callback) {
        callback = callback || function () { };

        if (this.traveling) { this.stop(); }
        this.traveling = true;
        this.destination = destination;

        // Show the routing button and set it to routing mode
        this.level.activateMovementButton();
        this.level.routing();

        // Calculate the route using the router (AJAX)
        this.router.calculateRoute(destination, (route) => {
            // Make sure the map hasn't been clicked while fetching the route
            if (destination === this.destination) {
                // Change the score increment
                this.level.score.setState('movement');
                this.move(route, callback);
            }
        });
    }
}

export default Player;