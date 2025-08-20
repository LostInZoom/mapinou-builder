import Layer from './layer.js';

class Rabbits extends Layer {
    constructor(options) {
        super(options);

        this.index = 'rabbits';
        this.basemap.map.addSource(this.index, this.source);

        this.layer.id = this.index;
        this.layer.source = this.index;
        this.layer.layout = {
            'icon-image': [
                'concat',
                'rabbits:',
                ['get', 'color'], '_',
                ['get', 'orientation'], '_',
                ['get', 'state'], '_',
                ['get', 'frame']
            ],
            'icon-size': ['get', 'scale'],
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
        };

        this.basemap.map.addLayer(this.layer);
    }
}

export default Rabbits;