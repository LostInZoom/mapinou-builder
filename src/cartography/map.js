import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom.js';
import {
    Circle as CircleStyle,
    Fill,
    Stroke,
    Style,
} from 'ol/style.js';

import proj4 from 'proj4';

import { makeDiv } from '../utils/dom';

class Basemap {
    constructor(application) {
        this.parent = application.gamenode;
        this.application = application;
        this.index = 'map';
        this.target = makeDiv(this.index, 'olmap');
        this.parent.append(this.target);
        this.view = new View();

        this.styles = {
            'player': new Style({
                image: new CircleStyle({
                    radius: 7,
                    fill: new Fill({
                        color: this.application.colors[this.application.theme]['main']
                    }),
                    stroke: new Stroke({
                        color: 'white',
                        width: 2,
                    }),
                }),
            }),
            'path': new Style({
                    stroke: new Stroke({
                    width: 6,
                    color: this.application.colors[this.application.theme]['main-transparent'],
                }),
            })
        };
        
        this.player = new Feature({ type: 'player' });
        this.playerLayer = new VectorLayer({
            source: new VectorSource({
                features: [ this.player ],
            }),
            style: this.styles['player'],
            zIndex: 50,
        });

        this.path = new Feature({ type: 'path' });
        this.pathLayer = new VectorLayer({
            source: new VectorSource({
                features: [ this.path ],
            }),
            style: this.styles['path'],
            zIndex: 10,
        });

        this.baselayer = new TileLayer({
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

        this.map = new Map({
            target: this.index,
            layers: [ this.playerLayer, this.pathLayer, this.baselayer ],
            view: this.view,
        });

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

    setPath(vertexes) {
        this.path.setGeometry(new LineString(vertexes));
    }
};


function project(epsg1, epsg2, coordinates) {
    return proj4(proj4.defs('EPSG:' + epsg1), proj4.defs('EPSG:' + epsg2), coordinates);
}

export { project }
export default Basemap