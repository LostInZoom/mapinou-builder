import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';

import proj4 from 'proj4';

import { makeDiv } from './utils/dom';

class Basemap {
    constructor(parent) {
        this.parent = parent;
        this.index = 'map';
        this.target = makeDiv(this.index, 'olmap');
        this.parent.append(this.target);
        this.view = new View();

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
            layers: [ this.baselayer ],
            view: this.view,
        });
    }

    setCenter(center) {
        this.view.setCenter(center);
    }

    setZoom(zoom) {
        this.view.setZoom(zoom);
    }
};

function project(epsg1, epsg2, coordinates) {
    return proj4(proj4.defs('EPSG:' + epsg1), proj4.defs('EPSG:' + epsg2), coordinates);
}

export { project }
export default Basemap