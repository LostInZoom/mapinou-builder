/**
 * Create a WebGL layer that can display multiple sprites
 */
class Layer {
    constructor(options) {
        this.options = options || {};

        this.basemap = this.options.basemap;
        this.id = this.options.id;
        this.params = this.basemap.options.app.options;
        this.behind = this.options.behind;
        this.protected = this.options.protected === undefined ? false : this.options.protected;

        this.minZoom = this.options.minZoom || null;
        this.maxZoom = this.options.maxZoom || null;
        this.orientable = this.options.orientable === undefined ? false : this.options.orientable;

        this.layer = {
            id: this.id,
            source: this.id,
        };
        this.source = {};
    }

    getId() {
        return this.id;
    }

    getLayer() {
        return this.layer;
    }

    getSource() {
        return this.source;
    }

    getFeatures() {
        return this.features ? this.features : [];
    }

    isProtected() {
        return this.protected;
    }

    remove() {
        this.clear();
        this.basemap.removeLayer(this);
        this.basemap.removeSource(this);
    }
}

export default Layer;