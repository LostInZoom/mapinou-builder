import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

import { angle } from "../cartography/analysis.js";

/**
 * Base class to create a new character on the map.
 */
class Character {
    constructor(options) {
        this.options = options || {};

        this.zindex = this.options.zindex || 1;
        this.basemap = options.basemap;
        this.coordinates = options.coordinates;
        this.params = this.basemap.params;
        
        this.layer = new VectorLayer({
            source: new VectorSource(),
            zIndex: this.zindex,
            updateWhileAnimating: true,
            updateWhileInteracting: true
        });

        this.basemap.map.addLayer(this.layer);
        this.basemap.layers.push(this.layer);

        this.moving = false;
        this.travelled = 0;        
    }

    display() {
        this.sprite.icon.setOpacity(1);
    }

    hide() {
        this.sprite.icon.setOpacity(0);
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
}

export default Character;