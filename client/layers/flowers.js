import Layer from './layer.js';

class Flowers extends Layer {
    constructor(options) {
        super(options);
        this.layer.layout['icon-image'] = [
            'concat',
            'flower:',
            ['get', 'state'], '_',
            ['get', 'frame']
        ]
        this.basemap.addLayer(this);
    }
}

export default Flowers;