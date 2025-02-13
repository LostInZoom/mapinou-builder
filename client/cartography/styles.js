import {
    Circle as CircleStyle,
    Fill,
    Stroke,
    Style,
} from 'ol/style.js';

import { getColorsByClassNames } from '../utils/parse.js';

class MapStyles {
    constructor() {
        this.styles = {
            'player': new Style({
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({
                        color: getColorsByClassNames('player').player
                    }),
                    stroke: new Stroke({
                        color: 'white',
                        width: 2,
                    }),
                }),
            }),
            'target': new Style({
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({
                        color: getColorsByClassNames('target').target
                    }),
                    stroke: new Stroke({
                        color: 'white',
                        width: 2,
                    }),
                }),
            }),
            'pitfalls': new Style({
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({
                        color: getColorsByClassNames('pitfalls').target
                    }),
                    stroke: new Stroke({
                        color: 'white',
                        width: 2,
                    }),
                }),
            }),
            'pitfallsArea': new Style({
                fill: new Fill({
                    color: getColorsByClassNames('pitfalls-transparent')['pitfalls-transparent']
                }),
                stroke: new Stroke({
                    color: getColorsByClassNames('pitfalls').target,
                    width: 3,
                }),
            }),
            'path': new Style({
                stroke: new Stroke({
                    width: 6,
                    color: getColorsByClassNames('player-transparent')['player-transparent']
                }),
            })
        };
    }

    get(type) {
        return this.styles[type];
    }
}

export { MapStyles };