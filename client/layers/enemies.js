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

        this.areas = [];

        this.featuresArea = [];
        this.sourceArea = {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: this.featuresArea
            }
        }
        this.basemap.map.addSource(this.name + '-area', this.sourceArea);

        this.layerArea = {
            id: this.name + '-area',
            type: 'fill',
            source: this.name + '-area',
            paint: {
                'fill-color': ['get', 'color'],
                'fill-opacity': ['get', 'opacity']
            }
        }

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

        this.areasVisible = false;
        this.basemap.addListener('render', () => {
            let threshold = this.params.game.routing;
            let zoom = this.basemap.getZoom();
            if (zoom >= threshold && !this.areasVisible) {
                this.areasVisible = true;
                this.revealAreas();
            }
            else if (zoom < threshold && this.areasVisible) {
                this.areasVisible = false;
                this.hideAreas();
            }
        });
    }

    revealAreas() {
        this.areas.forEach(area => { area.revealArea(); });
    }

    hideAreas() {
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
        const source = this.basemap.map.getSource(this.name + '-area');
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
}

export default Enemies;