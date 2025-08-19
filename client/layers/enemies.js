import { distance } from "ol/coordinate.js";

import { wait } from "../utils/dom.js";
import { weightedRandom } from "../utils/math.js";
import Layer from "./layer.js";
import { Bird, Hunter, Snake } from "../characters/enemy.js";

class Enemies extends Layer {
    constructor(options) {
        super(options);

        this.options = options || {};
        this.params = this.options.basemap.params;

        this.layer.setStyle({
            'icon-src': './sprites/enemies.png',
            'icon-offset': ['get', 'offset'],
            'icon-size': [64, 64],
            'icon-scale': ['get', 'scale'],
            'z-index': 1
        });

        this.weights = [1, 1, 1];
        this.statespool = ['hunter', 'snake', 'bird'];

        if (this.options.coordinates) {
            this.options.coordinates.forEach((coords) => {
                let o = this.options;
                o.coordinates = coords;
                o.layer = this;
                let choice = weightedRandom(this.statespool, this.weights.slice());
                if (choice === 'hunter') {
                    new Hunter(o);
                }
                else if (choice === 'snake') {
                    new Snake(o);
                }
                else if (choice === 'bird') {
                    new Bird(o);
                }
            });
        }
    }

    setOrientation(coordinates) {
        this.characters.forEach((enemy) => { enemy.setOrientation(coordinates); })
    }

    spawn(duration, callback) {
        callback = callback || function () { };
        let increment = duration / this.characters.length;
        let delay = 0;
        this.characters.forEach((enemy) => {
            wait(delay, () => { enemy.spawn(); })
            delay += increment;
        });
        wait(delay + 300, callback);
    }

    despawn(callback) {
        callback = callback || function () { };
        let amount = this.characters.length;
        let done = 0;
        this.characters.forEach((enemy) => {
            const clearing = 2;
            let cleared = 0;
            enemy.despawn(() => {
                if (++cleared === clearing) { if (++done === amount) { enemy.destroy(); callback(); } }
            });
            enemy.hideArea(() => {
                if (++cleared === clearing) { if (++done === amount) { enemy.destroy(); callback(); } }
            });
        });
    }

    roam() {
        this.characters.forEach((enemy) => { enemy.roam(enemy.getCoordinates(), this.params.game.tolerance.enemies); })
    }

    distanceOrder(coordinates) {
        this.characters = this.characters.sort((a, b) => {
            return distance(a.getCoordinates(), coordinates) - distance(b.getCoordinates(), coordinates);
        });
    }
}

export default Enemies;