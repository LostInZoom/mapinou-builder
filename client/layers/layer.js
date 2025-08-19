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
        this.params = this.basemap.options.app.options;

        this.zIndex = this.options.zIndex || 1;
        this.minZoom = this.options.minZoom || null;
        this.maxZoom = this.options.maxZoom || null;
        this.orientable = this.options.orientable === undefined ? false : this.options.orientable;

        this.features = [];

        this.source = {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: this.features }
        };

        this.layer = {
            type: 'symbol',
            layout: {
                'icon-image': ['get', 'frame'],
                'icon-size': 1
            }
        };

        this.characters = [];
        this.frames = {};
    }

    addCharacter(character) {
        this.characters.push(character);
        this._updateSource();
    }

    getCharacters() {
        return this.characters;
    }

    updateCharacter(id, character) {
        const index = this.characters.findIndex(c => c.properties.id === id);
        if (index !== -1) {
            this.characters[index] = character;
            this._updateSource();
        }
    }

    _updateSource() {
        const source = this.basemap.map.getSource(this.id);
        if (source) {
            source.setData({ type: 'FeatureCollection', features: this.features });
        }
    }

    async _loadSpriteSheet(sprite, json) {
        const img = new Image();
        img.src = sprite;
        await img.decode();
        const response = await fetch(json);
        const data = await response.json();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        for (const [name, def] of Object.entries(data)) {
            const { x, y, width, height, pixelRatio } = def;
            canvas.width = width;
            canvas.height = height;
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
            if (!this.basemap.map.hasImage(name)) {
                this.basemap.map.addImage(name, ctx.getImageData(0, 0, width, height), { pixelRatio: pixelRatio || 1 });
            }
            const parts = name.split("_");
            const key = `${parts[0]}_${parts[1]}_${parts[2]}`;
            if (!this.frames[key]) this.frames[key] = [];
            this.frames[key].push(name);
        }

        // Order frames for animation
        for (const key in this.frames) {
            this.frames[key].sort((a, b) => {
                const n1 = parseInt(a.split("_").pop(), 10);
                const n2 = parseInt(b.split("_").pop(), 10);
                return n1 - n2;
            });
        }
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