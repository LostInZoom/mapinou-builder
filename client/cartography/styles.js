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
                        color: getColorsByClassNames('pitfalls').pitfalls
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
                    color: getColorsByClassNames('pitfalls').pitfalls,
                    width: 3,
                }),
            }),
            'bonus': new Style({
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({
                        color: getColorsByClassNames('bonus').bonus
                    }),
                    stroke: new Stroke({
                        color: 'white',
                        width: 2,
                    }),
                }),
            }),
            'bonusArea': new Style({
                fill: new Fill({
                    color: getColorsByClassNames('bonus-transparent')['bonus-transparent']
                }),
                stroke: new Stroke({
                    color: getColorsByClassNames('bonus').bonus,
                    width: 3,
                }),
            }),
            'path': new Style({
                stroke: new Stroke({
                    width: 6,
                    color: getColorsByClassNames('path').path
                }),
            })
        };
    }

    get(type) {
        return this.styles[type];
    }
}

export { MapStyles };