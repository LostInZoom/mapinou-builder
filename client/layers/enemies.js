import * as turf from "@turf/turf";

import { wait } from "../utils/dom.js";
import { weightedRandom } from "../utils/math.js";
import { Bird, Hunter, Snake } from "../characters/enemy.js";
import Characters from "./characters.js";
import { within } from "../cartography/analysis.js";

class Enemies extends Characters {
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

        this.areas = [];
        this.featuresArea = [];
        this.sourceArea = {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: this.featuresArea
            }
        }

        this.layerArea = {
            id: this.id + '-area',
            type: 'fill',
            source: this.id + '-area',
            paint: {
                'fill-color': ['get', 'color'],
                'fill-opacity': ['get', 'opacity']
            }
        }

        this.basemap.addLayer(this);
        this.basemap.addAreaLayer(this);

        // This stores enemies that already stroke
        this.stroke = [];
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

    remove() {
        this.basemap.map.removeLayer(this.id);
        this.basemap.map.removeLayer(this.id + '-area');
        this.basemap.map.removeSource(this.id);
        this.basemap.map.removeSource(this.id + '-area');
    }

    getAreaLayer() {
        return this.layerArea;
    }

    getAreaSource() {
        return this.sourceArea;
    }

    revealAreas() {
        this.areasVisible = true;
        this.areas.forEach(area => { area.revealArea(); });
    }

    hideAreas() {
        this.areasVisible = false;
        this.areas.forEach(area => { area.hideArea(); });
    }

    setOrientationFromCoordinates(coordinates) {
        this.characters.forEach((enemy) => { enemy.setOrientationFromCoordinates(coordinates); })
    }

    orderByDistance(coordinates) {
        this.characters = this.characters.sort((a, b) => {
            return turf.distance(a.getCoordinates(), coordinates) - turf.distance(b.getCoordinates(), coordinates);
        });
    }

    addArea(area) {
        this.areas.push(area);
        this.addFeatureArea(area.area1);
        this.addFeatureArea(area.area2);
    }

    addFeatureArea(feature) {
        this.featuresArea.push(feature);
        this.updateSourceArea();
    }

    updateSourceArea() {
        const source = this.basemap.map.getSource(this.id + '-area');
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: this.featuresArea
            });
        }
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

    handle(player) {
        const position = player.getCoordinates();
        for (let i = 0; i < this.characters.length; i++) {
            let enemy = this.characters[i];
            enemy.setOrientationFromCoordinates(position);

            if (within(position, enemy.getCoordinates(), this.params.game.tolerance.enemies)) {
                // Check if the enemy has not already striked
                if (!this.stroke.includes(enemy)) {
                    this.stroke.push(enemy);
                    if (!player.isInvulnerable()) {
                        this.level.score.addModifier('enemies');
                        player.makeInvulnerable(this.params.game.invulnerability, 300);
                    }
                }
            } else {
                // If it was in close enemies
                if (this.stroke.includes(enemy)) {
                    // Remove it from the list
                    let i = this.stroke.indexOf(enemy);
                    if (i > -1) { this.stroke.splice(i, 1); }
                }
            }
        }
    }
}

export default Enemies;