import * as turf from "@turf/turf";

import { wait } from "../utils/dom.js";
import { weightedRandom } from "../utils/math.js";
import Layer from "./layer.js";
import { Bird, Hunter, Snake } from "../characters/enemy.js";

class Enemies extends Layer {
    constructor(options) {
        super(options);
        this.layer.layout['icon-image'] = [
            'concat',
            'enemies:',
            ['get', 'type'], '_',
            ['get', 'state'], '_',
            ['get', 'orientation'], '_',
            ['get', 'frame']
        ]
        this.basemap.addLayer(this);

        this.weights = [1, 1, 1];
        this.statespool = ['hunter', 'snake', 'bird'];

        if (this.options.coordinates) {
            this.options.coordinates.forEach((coords) => {
                let o = this.options;
                o.coordinates = coords;
                o.layer = this;
                let choice = weightedRandom(this.statespool, this.weights.slice());
                if (choice === 'hunter') { new Hunter(o); }
                else if (choice === 'snake') { new Snake(o); }
                else if (choice === 'bird') { new Bird(o); }
            });
        }
    }

    setOrientationFromCoordinates(coordinates) {
        this.characters.forEach((enemy) => { enemy.setOrientationFromCoordinates(coordinates); })
    }

    orderByDistance(coordinates) {
        this.characters = this.characters.sort((a, b) => {
            return turf.distance(a.getCoordinates(), coordinates) - turf.distance(b.getCoordinates(), coordinates);
        });
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

    // roam() {
    //     this.characters.forEach((enemy) => { enemy.roam(enemy.getCoordinates(), this.params.game.tolerance.enemies); })
    // }
}

export default Enemies;