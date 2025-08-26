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
        this.behind = this.options.behind;

        this.minZoom = this.options.minZoom || null;
        this.maxZoom = this.options.maxZoom || null;
        this.orientable = this.options.orientable === undefined ? false : this.options.orientable;
    }

    getName() {
        return this.name;
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