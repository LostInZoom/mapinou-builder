import { wait } from "../utils/dom";
import Layer from "./layer";

class Characters extends Layer {
    constructor(options) {
        super(options);
        this.level = this.options.level;

        this.characters = [];
        this.features = [];

        this.source = {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: this.features
            }
        };

        this.basemap.map.addSource(this.name, this.source);

        this.layer = {
            id: this.name,
            type: 'symbol',
            source: this.name,
            layout: {
                'icon-size': ['get', 'scale'],
                'icon-offset': ['get', 'offset'],
                'icon-allow-overlap': true,
                'icon-ignore-placement': true,
            }
        };
    }

    getNumber() {
        return this.characters.length;
    }

    getFeatures() {
        return this.features;
    }

    addFeature(feature) {
        this.features.push(feature);
        this.updateSource();
    }

    getCharacter(index) {
        if (index < this.getNumber()) {
            return this.characters[index];
        } else {
            return undefined;
        }
    }

    getActiveCharacters() {
        let actives = [];
        this.characters.forEach(c => {
            if (c.isActive()) { actives.push(c); }
        });
        return actives;
    }

    addCharacter(character) {
        this.characters.push(character);
        this.addFeature(character.getFeature());
    }

    removeCharacter(character) {
        let id = character.getId();
        for (let i = 0; i < this.characters.length; i++) {
            if (this.characters[i] == character) {
                this.characters.splice(i, 1);
                break;
            }
        }
        for (let i = 0; i < this.features.length; i++) {
            if (this.features[i].properties.id == id) {
                this.features.splice(i, 1);
                break;
            }
        }
        this.updateSource();
    }

    updateSource() {
        const source = this.basemap.map.getSource(this.name);
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: this.features
            });
        }
    }

    despawnCharacters(callback) {
        callback = callback || function () { };
        let delay = 0;
        this.characters.forEach(character => {
            let d = character.getSpawnDuration();
            if (d > delay) { delay = d; }
            character.despawn();
        });
        wait(delay, callback);
    }

    clear() {
        this.characters.forEach(character => { this.removeCharacter(character) });
        this.characters = [];
    }

    destroy() {
        this.clear();
        this.layer.dispose();
        this.basemap.map.removeLayer(this.layer);
    }
}

export default Characters;