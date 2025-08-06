import Layer from './layer.js';

class Rabbits extends Layer {
    constructor(options) {
        super(options);
        this.layer.setStyle({
            'icon-src': './sprites/rabbits.png',
            'icon-offset': ['var', 'offset'],
            'icon-size': [52, 52],
            'icon-scale': ['get', 'scale'],
            'z-index': 1
        });
    }
}

export default Rabbits;