import Layer from './layer.js';

class Rabbits extends Layer {
    constructor(options, callback) {
        super(options);
        callback = callback || function() {};

        this.index = 'rabbits';
        this.basemap.map.addSource(this.index, this.source);

        this.layer.id = this.index;
        this.layer.source = this.index;
        this.basemap.map.addLayer(this.layer);

        this._loadSpriteSheet('./sprites/rabbits.png', './sprites/rabbits.json').then(callback);

        // this.layer.setStyle({
        //     'icon-src': './sprites/rabbits.png',
        //     'icon-offset': ['get', 'offset'],
        //     'icon-size': [52, 52],
        //     'icon-scale': ['get', 'scale'],
        //     'z-index': 1
        // });
    }
}

export default Rabbits;