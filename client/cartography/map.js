import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { extend } from 'ol/extent.js';
import TileLayer from 'ol/layer/Tile.js';

import WebGLTileLayer from 'ol/layer/WebGLTile.js';

import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import { defaults } from 'ol/interaction/defaults.js';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import DragPan from 'ol/interaction/DragPan.js';
import PinchZoom from 'ol/interaction/PinchZoom.js';
import PointerInteraction from 'ol/interaction/Pointer.js';
import { unByKey } from 'ol/Observable.js';

import { Enemies } from '../characters/enemies.js';
import Player from '../characters/player.js';
import Target from '../characters/target.js';
import { Helpers } from '../characters/helpers.js';
import Position from '../game/position.js';
import { addClass, makeDiv, removeClass, wait } from '../utils/dom.js';
import Rabbits from '../characters/rabbits.js';

class Basemap {
    constructor(options, callback) {
        callback = callback || function () { };
        this.options = options || {};
        this.params = options.app.options;

        this.layers = [];
        this.parent = this.options.parent;

        this.container = makeDiv(null, 'map');
        if (options.class) { addClass(this.container, options.class); }
        this.parent.append(this.container);

        this.view = new View({});

        this.baselayer = new WebGLTileLayer({
            preload: 'Infinity',
            cacheSize: 1024,
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

        this.interactions = defaults();
        this.map = new Map({
            target: this.container,
            layers: [this.baselayer],
            view: this.view,
            interactions: this.interactions,
        });

        this.setInteractions(false);

        if (this.options.center) { this.view.setCenter(this.options.center); }
        if (this.options.zoom) { this.view.setZoom(this.options.zoom); }
        if (this.options.extent) {
            let res = this.view.getResolutionForExtent(this.options.extent, this.map.getSize());
            this.zoom = this.view.getZoomForResolution(res);
            this.view.setZoom(this.zoom);
        }

        this.listeners = [];
        this.routable = true;

        this.maskcontainer = makeDiv(null, 'map-mask-container');
        this.east = makeDiv(null, 'map-mask meridian east');
        this.west = makeDiv(null, 'map-mask meridian west');
        this.north = makeDiv(null, 'map-mask parallel north');
        this.south = makeDiv(null, 'map-mask parallel south');
        this.maskcontainer.append(this.east, this.west, this.north, this.south);
        this.container.append(this.maskcontainer);

        this.map.once('loadend', callback);
    }

    setCenter(center) {
        this.view.setCenter(center);
    }

    getCenter() {
        return this.view.getCenter();
    }

    setZoom(zoom) {
        this.view.setZoom(zoom);
    }

    getZoom() {
        return this.view.getZoom();
    }

    getResolution() {
        return this.view.getResolution();
    }

    getPixel(coordinates) {
        return this.map.getPixelFromCoordinate(coordinates);
    }

    getWidth() {
        return this.container.offsetWidth;
    }

    getHeight() {
        return this.container.offsetHeight;
    }

    dispose() {
        this.baselayer.dispose();
    }

    animate(options, callback) {
        callback = callback || function () { };
        this.view.animate(options, callback);
    }

    fit(extent, options, callback) {
        options.callback = callback;
        this.map.getView().fit(extent, options);
    }

    isVisible(position, padding = 50) {
        let visible = false;
        let size = this.map.getSize();
        let [minx, maxy] = this.map.getCoordinateFromPixel([padding, padding]);
        let [maxx, miny] = this.map.getCoordinateFromPixel([size[0] - padding, size[1] - padding]);
        let [x, y] = position;
        if (x > minx && x < maxx && y > miny && y < maxy) { visible = true; }
        return visible;
    }

    setInteractions(interactable = false) {
        this.interactions.forEach((interaction) => {
            if (interactable) {
                if (interaction instanceof MouseWheelZoom) { interaction.setActive(true); }
                else if (interaction instanceof DragPan) { interaction.setActive(true); }
                else if (interaction instanceof PinchZoom) { interaction.setActive(true); }
                else if (interaction instanceof PointerInteraction) { interaction.setActive(true); }
                else { interaction.setActive(false); }
            } else { interaction.setActive(false); }
        });
    }

    removeLayer(layer) {
        for (let i = 0; i < this.layers.length; i++) {
            if (this.layers[i] === layer) {
                this.map.removeLayer(layer);
                this.layers.splice(i, 1);
                break;
            }
        }
    }

    removeLayers() {
        this.layers.forEach(layer => { this.map.removeLayer(layer); })
        this.layers = [];
    }

    createCharacters(level, options) {
        this.rabbits = new Rabbits({ basemap: this });

        this.player = new Player({
            basemap: this,
            level: level,
            layer: this.rabbits,
            color: 'white',
            coordinates: options.player,
            zIndex: 50
        });
        this.player.setOrientation(options.target)

        this.target = new Target({
            basemap: this,
            level: level,
            layer: this.rabbits,
            colors: ['brown', 'sand', 'grey'],
            color: 'random',
            coordinates: options.target,
            zIndex: 40
        });

        // this.helpers = new Helpers({
        //     basemap: this,
        //     level: level,
        //     coordinates: options.helpers,
        //     minZoom: this.params.game.routing,
        //     zIndex: 30,
        // });

        // this.enemies = new Enemies({
        //     basemap: this,
        //     level: level,
        //     coordinates: options.enemies,
        //     zIndex: 20,
        // });
        // this.enemies.setOrientation(options.player);
        // this.enemies.distanceOrder(options.player);
    }

    activateMovement(callback) {
        callback = callback || function () { };

        let movement = this.map.on('click', () => {
            if (this.routable) {
                let destination = this.map.getEventCoordinate(event);
                this.player.travel(destination, callback);
            }
        });

        this.position = new Position({
            basemap: this,
            player: this.player
        });
        let routing = this.map.on('postrender', () => {
            // Handle the routability of the map
            if (this.view.getZoom() >= this.params.game.routing && !this.routable) {
                this.makeRoutable();
            }
            else if (this.view.getZoom() < this.params.game.routing && this.routable) {
                this.makeUnroutable();
            }
            this.position.update();
        });

        this.addListeners(movement, routing);
    }

    addListeners(...listeners) {
        listeners.forEach(l => { this.listeners.push(l); });
    }

    removeListeners() {
        this.listeners.forEach((listener) => { unByKey(listener); });
        this.listeners = [];
    }

    getExtentForData() {
        let extent;
        this.layers.forEach((layer) => {
            if (extent === undefined) { extent = layer.getSource().getExtent() }
            else { extent = extend(extent, layer.getSource().getExtent()) }
        });
        return extent;
    }

    makeRoutable(callback) {
        callback = callback || function () { };
        if (this.routable) { callback(); }
        else {
            this.routable = true;
            addClass(this.maskcontainer, 'routable');
            wait(500, callback);
        }
    }

    makeUnroutable(callback) {
        callback = callback || function () { };
        if (!this.routable) { callback(); }
        else {
            this.routable = false;
            removeClass(this.maskcontainer, 'routable');
            wait(500, callback);
        }
    }

    clear(callback) {
        callback = callback || function () { };
        let cleared = 0;
        const clearing = 5;

        if (this.player) {
            if (this.player.traveling) { this.player.stop(); }
            this.player.despawn(() => {
                if (++cleared === clearing) { callback(); }
            });
        } else { ++cleared }
        if (this.target) {
            this.target.despawn(() => {
                if (++cleared === clearing) { callback(); }
            });
        } else { ++cleared }
        if (this.enemies) {
            this.enemies.despawn(() => {
                if (++cleared === clearing) { callback(); }
            });
        } else { ++cleared }
        if (this.helpers) {
            this.helpers.despawn(() => {
                if (++cleared === clearing) { callback(); }
            });
        } else { ++cleared }
        if (this.position) {
            this.position.destroy(() => {
                if (++cleared === clearing) { callback(); }
            });
        } else { ++cleared }
        if (cleared === clearing) { callback(); }
    }
}

export default Basemap;