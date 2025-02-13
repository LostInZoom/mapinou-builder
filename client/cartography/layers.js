import TileLayer from 'ol/layer/Tile.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';

import { MapStyles } from './styles';

class MapLayers {
    constructor() {
        this.styles = new MapStyles();
        this.baselayer;
        this.layers = {};
        this.features = {}
    }

    add(name, zindex) {
        this.features[name] = new Feature({ type: name });
        this.layers[name] = new VectorLayer({
            source: new VectorSource({
                features: [ this.features[name] ],
            }),
            style: this.styles.get(name),
            zIndex: zindex,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
        });
    }

    setBaseLayer() {
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
        });
    }

    getLayer(name) {
        return this.layers[name];
    }

    getFeature(name) {
        return this.features[name];
    }

    getBaseLayer() {
        return this.baselayer;
    }
    
    addFeature(name, feature) {
        this.layers[name].getSource().addFeature(feature);
    }

    setGeometry(name, geometry) {
        this.features[name].setGeometry(geometry);
    }

    setMaxZoom(name, zoom) {
        this.layers[name].setMaxZoom(zoom);
    }

    setMinZoom(name, zoom) {
        this.layers[name].setMinZoom(zoom);
    }
}

export { MapLayers };