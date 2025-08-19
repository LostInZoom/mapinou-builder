import Layer from '../characters/layer.js';

class Rabbits extends Layer {
    constructor(options) {
        super(options);
        this.layer.setStyle({
            'icon-src': './sprites/rabbits.png',
            'icon-offset': ['get', 'offset'],
            'icon-size': [52, 52],
            'icon-scale': ['get', 'scale'],
            'z-index': 1
        });
    }
}

export default Rabbits;