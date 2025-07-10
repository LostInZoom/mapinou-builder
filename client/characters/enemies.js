import { getVectorContext } from "ol/render";
import { LineString } from "ol/geom";

import Character from "./character.js";
import { angle, randomPointInCircle } from "../cartography/analysis.js";
import Sprite from "../cartography/sprite.js";
import { wait } from "../utils/dom.js";
import { distance } from "ol/coordinate.js";

class Enemies {
    constructor(options) {
        this.options = options || {};
        this.params = this.options.basemap.params;

        this.enemies = [];
        if (this.options.coordinates) {
            this.options.coordinates.forEach((coords) => {
                let o = this.options;
                o.coordinates = coords;
                this.enemies.push(new Enemy(o));
            });
        }
    }

    setOrientation(coordinates) {
        this.enemies.forEach((enemy) => { enemy.setOrientation(coordinates); })
    }

    getEnemies() {
        return this.enemies;
    }

    spawn(duration, callback) {
        callback = callback || function () {};
        let increment = duration / this.enemies.length;
        let delay = 0;
        this.enemies.forEach((enemy) => {
            wait(delay, () => { enemy.spawn(); })
            delay += increment;
        });
        wait(delay + 300, callback);
    }

    roam() {
        this.enemies.forEach((enemy) => { enemy.roam(enemy.getCoordinates(), this.params.game.tolerance.enemies); })
    }

    distanceOrder(coordinates) {
        this.enemies = this.enemies.sort((a, b) => {
            return distance(a.getCoordinates(), coordinates) - distance(b.getCoordinates(), coordinates);
        });
    }
}

class Enemy extends Character {
    constructor(options) {
        super(options);
        this.states = {
            idle: {
                north: { line: 0, length: 3 },
                east: { line: 1, length: 3 },
                south: { line: 2, length: 3 },
                west: { line: 3, length: 3 },
            }
        }

        this.sprite = new Sprite({
            type: 'dynamic',
            layer: this.layer,
            src: './sprites/snake.png',
            width: 64,
            height: 64,
            scale: 0.8,
            anchor: [0.5, 0.7],
            framerate: 300,
            coordinates: this.coordinates,
            states: this.states
        }, () => {
            this.sprite.animate();
        });
    }

    roam(coordinates, radius) {
        this.sprite.setState('idle');

        let destination = randomPointInCircle(this.coordinates, radius);
        let a = angle(coordinates, destination);
        this.sprite.setDirectionFromAngle(a);

        const line = new LineString([ coordinates, destination ]);
        const length = line.getLength();
        const speed = this.params.game.speed.enemies;
        const position = this.sprite.getGeometryClone();
        this.sprite.hide();

        let lastTime = Date.now();
        let distance = 0;
        let newPosition = position.getCoordinates();

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
                newPosition = line.getCoordinateAt(distance / length);
                position.setCoordinates(newPosition);
                context.drawGeometry(position);
                self.basemap.map.render();
            }
            else {
                self.layer.un('postrender', animate);
                position.setCoordinates(destination);
                context.drawGeometry(position);
                self.sprite.display();
                self.roam(destination, radius);
            }
        }
    }
}

export { Enemies, Enemy };