import Characters from './characters.js';

class Rabbits extends Characters {
    constructor(options) {
        super(options);
        this.layer.layout['icon-image'] = [
            'concat',
            'rabbits:',
            ['get', 'color'], '_',
            ['get', 'state'], '_',
            ['get', 'orientation'], '_',
            ['get', 'frame']
        ]
        this.basemap.addLayer(this);
    }
}

export default Rabbits;