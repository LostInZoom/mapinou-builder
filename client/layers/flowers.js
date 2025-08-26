import Characters from './characters.js';

class Flowers extends Characters {
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