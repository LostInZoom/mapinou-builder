import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import { angle, within } from "../cartography/analysis.js";

/**
 * Base class to create a new character on the map.
 */
class Character {
    constructor(options) {
        this.options = options || {};

        this.zIndex = this.options.zIndex || 1;
        this.minZoom = this.options.minZoom || null;
        this.maxZoom = this.options.maxZoom || null;

        this.basemap = options.basemap;
        this.coordinates = options.coordinates;
        this.params = this.basemap.params;
        
        this.layer = new VectorLayer({
            source: new VectorSource(),
            zIndex: this.zIndex,
            updateWhileAnimating: true,
            updateWhileInteracting: true
        });

        if (this.maxZoom) { this.layer.setMaxZoom(this.maxZoom); }
        if (this.minZoom) { this.layer.setMinZoom(this.minZoom); }

        this.basemap.map.addLayer(this.layer);
        this.basemap.layers.push(this.layer);

        this.moving = false;
        this.active = true;
        this.travelled = 0;
    }

    display() {
        this.sprite.icon.setOpacity(1);
    }

    hide() {
        this.sprite.icon.setOpacity(0);
    }

    activate() {
        this.active = true;
    }

    deactivate() {
        this.active = false;
    }

    isActive() {
        return this.active;
    }

    getLayer() {
        return this.layer;
    }

    getCoordinates() {
        return this.sprite.getCoordinates();
    }

    setOrientation(coordinates) {
        this.sprite.setDirection(angle(this.coordinates, coordinates));
    }

    getWithin(objects, distance) {
        let intersecting = [];
        for (let i = 0; i < objects.length; i++) {
            let obj = objects[i];
            if (within(this.getCoordinates(), obj.getCoordinates(), distance)) {
                intersecting.push(obj);
            }
        }
        return intersecting;
    }
}

export default Character;