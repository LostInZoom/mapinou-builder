import WebGLVectorLayer from 'ol/layer/WebGLVector.js';
import VectorSource from 'ol/source/Vector.js';
import { wait } from '../utils/dom';

/**
 * Create a WebGL layer that can display multiple sprites
 */
class Layer {
    constructor(options) {
        this.options = options || {};

        this.basemap = this.options.basemap;
        this.name = this.options.name;
        this.params = this.basemap.options.app.options;

        this.zIndex = this.options.zIndex || 1;
        this.minZoom = this.options.minZoom || null;
        this.maxZoom = this.options.maxZoom || null;
        this.orientable = this.options.orientable === undefined ? false : this.options.orientable;

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

    getName() {
        return this.name;
    }

    getNumber() {
        return this.characters.length;
    }

    getCharacter(index) {
        if (index < this.getNumber()) {
            return this.characters[index];
        } else {
            return undefined;
        }
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

    getFeatures() {
        return this.features;
    }

    addFeature(feature) {
        this.features.push(feature);
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









    // changed() {
    //     this.source.changed();
    // }

    // getLayer() {
    //     return this.layer;
    // }

    // getSource() {
    //     return this.source;
    // }

    // getCharacter(index) {
    //     if (index < this.getCharactersNumber()) {
    //         return this.characters[index];
    //     } else {
    //         return undefined;
    //     }
    // }

    // addCharacter(character) {
    //     this.characters.push(character);
    //     this.source.addFeature(character.getFeature());
    // }

    // removeCharacter(character) {
    //     for (let i = 0; i < this.characters.length; i++) {
    //         if (this.characters[i] == character) {
    //             this.source.removeFeature(character.getFeature());
    //             this.characters.splice(i, 1);
    //             break;
    //         }
    //     }
    // }

    // getCharactersNumber() {
    //     return this.characters.length;
    // }

    // despawnCharacters(callback) {
    //     callback = callback || function () { };
    //     let delay = 0;
    //     this.characters.forEach(character => {
    //         let d = character.getSpawnDuration();
    //         if (d > delay) { delay = d; }
    //         character.despawn();
    //     });
    //     wait(delay, callback);
    // }

    // render() {
    //     this.layer.render();
    // }

    // clear() {
    //     this.characters.forEach(character => {
    //         this.source.removeFeature(character.getFeature());
    //     });
    //     this.characters = [];
    // }

    // destroy() {
    //     this.clear();
    //     this.layer.dispose();
    //     this.basemap.map.removeLayer(this.layer);
    // }
}

export default Layer;