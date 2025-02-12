import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Point } from 'ol/geom.js';
import { defaults } from 'ol/interaction/defaults.js';
import { Feature } from 'ol';
import {
    Circle as CircleStyle,
    Fill,
    Stroke,
    Style,
} from 'ol/style.js';

import { addClass, makeDiv, removeClass } from "../utils/dom.js";
import { getColorsByClassNames } from '../utils/parse.js';

class TutorialMap {
    constructor(page, index) {
        this.page = page;
        this.app = page.app;
        this.index = index;
        this.container = makeDiv('menu-map-' + this.index, 'menu-map olmap');

        this.mask = makeDiv(null, 'mask-map mask ' + this.page.getTheme());
        this.page.themed.push(this.mask);
        this.loader = makeDiv(null, 'loader');
        this.mask.append(this.loader);

        this.container.append(this.mask);
        this.page.container.append(this.container);

        this.view = new View();

        this.layer = new TileLayer({
            preload: 'Infinity',
            source: new WMTS({
                url: 'https://data.geopf.fr/wmts',
                layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
                matrixSet: 'PM',
                format: 'image/png',
                style: 'normal',
                dimensions: [256, 256],
                tileGrid: new WMTSTileGrid({
                    origin: [-20037508, 20037508],
                    resolutions: [
                        156543.03392804103, 78271.5169640205, 39135.75848201024, 19567.879241005125, 9783.939620502562,
                        4891.969810251281, 2445.9849051256406, 1222.9924525628203, 611.4962262814101, 305.74811314070485,
                        152.87405657035254, 76.43702828517625, 38.218514142588134, 19.109257071294063, 9.554628535647034,
                        4.777314267823517, 2.3886571339117584, 1.1943285669558792, 0.5971642834779396, 0.29858214173896974,
                        0.14929107086948493, 0.07464553543474241
                    ],
                    matrixIds: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"],
                })
            })
        })

        this.player = new Feature({ type: 'player' });
        this.playerLayer = new VectorLayer({
            source: new VectorSource({
                features: [ this.player ],
            }),
            style: new Style({
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
            zIndex: 50,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
        });

        this.map = new Map({
            target: this.container,
            layers: [
                this.layer,
                this.playerLayer
            ],
            view: this.view,
            interactions: new defaults({
                altShiftDragRotate: false,
                doubleClickZoom: false,
                keyboard: false,
                mouseWheelZoom: false,
                shiftDragZoom: false,
                dragPan: false,
                pinchRotate: false,
                pinchZoom: false,
                pointerInteraction: false,
            })
        });

        this.map.once('loadend', () => {
            this.loaded();
        })
    }

    setCenter(center) {
        this.view.setCenter(center);
    }

    setZoom(zoom) {
        this.view.setZoom(zoom);
    }

    setPlayer(position) {
        this.player.setGeometry(new Point(position));
    }

    loading() {
        removeClass(this.mask, 'loaded');
    }

    loaded() {
        addClass(this.mask, 'loaded');
    }
}

export default TutorialMap;