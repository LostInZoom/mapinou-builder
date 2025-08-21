import { Map } from 'maplibre-gl';

import { extend } from 'ol/extent.js';

import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import DragPan from 'ol/interaction/DragPan.js';
import PinchZoom from 'ol/interaction/PinchZoom.js';
import PointerInteraction from 'ol/interaction/Pointer.js';
import { unByKey } from 'ol/Observable.js';

import Enemies from '../layers/enemies.js';
import Player from '../characters/player.js';
import Target from '../characters/target.js';
import { Helpers } from '../layers/helpers.js';
import Position from '../game/position.js';
import { addClass, makeDiv, removeClass, wait } from '../utils/dom.js';
import Rabbits from '../layers/rabbits.js';
import { project, toLongLat } from './analysis.js';

class Basemap {
    constructor(options, callback) {
        callback = callback || function () { };
        this.options = options || {};
        this.params = options.app.options;

        this.spritesheets = ['rabbits'];

        this.layers = [];
        this.parent = this.options.parent;

        this.container = makeDiv(null, 'map');
        if (options.class) { addClass(this.container, options.class); }
        this.parent.append(this.container);

        let center = this.options.center || [0, 0];
        let zoom = this.options.zoom || 1;

        if (this.options.extent) {
            const o = this.map.cameraForBounds(this.options.extent);
            zoom = o.zoom;
            center = o.center;
        }

        this.map = new Map({
            container: this.container,
            center: center,
            zoom: zoom,
            interactive: this.options.interactive === undefined ? true : this.options.interactive,
            canvasContextAttributes: { antialias: true },
            style: {
                'version': 8,
                'sources': {
                    'PLANIGN': {
                        'type': 'raster',
                        'tiles': [
                            "https://data.geopf.fr/wmts?" +
                            "layer=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2" +
                            "&style=normal" +
                            "&tilematrixset=PM" +
                            "&Service=WMTS" +
                            "&Request=GetTile" +
                            "&Version=1.0.0" +
                            "&Format=image/png" +
                            "&TileCol={x}" +
                            "&TileRow={y}" +
                            "&TileMatrix={z}"
                        ],
                        'tileSize': 256,
                    }
                },
                'layers': [
                    {
                        'id': 'basemap',
                        'type': 'raster',
                        'source': 'PLANIGN',
                        'minzoom': 0,
                        'maxzoom': 22
                    }
                ],
                // "sprite": [
                //     {
                //         "id": "rabbits",
                //         "url": "http://localhost:8001/mapinou/sprites/rabbits"
                //     }
                // ],
                "fadeDuration": 0
            },
        });

        this.map.on('load', () => { callback(); });

        this.listeners = [];
        this.routable = true;

        this.maskcontainer = makeDiv(null, 'map-mask-container');
        this.east = makeDiv(null, 'map-mask meridian east');
        this.west = makeDiv(null, 'map-mask meridian west');
        this.north = makeDiv(null, 'map-mask parallel north');
        this.south = makeDiv(null, 'map-mask parallel south');
        this.maskcontainer.append(this.east, this.west, this.north, this.south);
        this.container.append(this.maskcontainer);
    }

    remove() {
        this.map.remove();
    }

    getContainer() {
        return this.container;
    }

    setCenter(center) {
        this.map.setCenter(center);
    }

    getCenter() {
        return this.map.getCenter();
    }

    setZoom(zoom) {
        this.map.setZoom(zoom);
    }

    getZoom() {
        return this.map.getZoom();
    }

    getResolution() {
        const R = 6378137;
        const tileSize = 256;
        const zoom = this.map.getZoom();
        const res = (2 * Math.PI * R) / (tileSize * Math.pow(2, zoom));
        const lat = this.map.getCenter().lat * Math.PI / 180;
        const resLat = res * Math.cos(lat);
        return resLat;
    }

    getPixelAtCoordinates(coordinates) {
        let p = this.map.project(coordinates);
        return [p.x, p.y];
    }

    getCoordinatesAtPixel(coordinates) {
        return this.map.unproject(coordinates).toArray();
    }

    getWidth() {
        return this.container.offsetWidth;
    }

    getHeight() {
        return this.container.offsetHeight;
    }

    animate(options, callback) {
        callback = callback || function () { };
        this.map.easeTo(options);
        this.map.once('moveend', callback);
    }

    fit(extent, options, callback) {
        const padding = options.padding || 0;
        const o = this.map.cameraForBounds(extent, { padding: padding });
        options.center = o.center;
        options.zoom = o.zoom;
        this.animate(options, callback);
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

        this.enemies = new Enemies({
            basemap: this,
            level: level,
            coordinates: options.enemies,
            zIndex: 20,
        });

        this.enemies.setOrientation(options.player);
        this.enemies.distanceOrder(options.player);
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

    async loadSprites() {
        for (let i = 0; i < this.spritesheets.length; i++) {
            const name = this.spritesheets[i];

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = './sprites/' + name + '.png';

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            let json = await fetch('./sprites/' + name + '.json');
            let data = await json.json();

            console.log(data);

            for (const key in data) {
                const icon = data[key];
                const canvas = document.createElement('canvas');
                canvas.width = icon.width;
                canvas.height = icon.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(
                    img,
                    icon.x, icon.y, icon.width, icon.height,
                    0, 0, icon.width, icon.height
                );
                const bitmap = await createImageBitmap(canvas);
                this.map.addImage(`${name}:${key}`, bitmap, {
                    x: icon.x,
                    y: icon.y,
                    width: icon.width,
                    height: icon.height,
                    pixelRatio: icon.pixelRatio
                });
            }
        }
    }
}

export default Basemap;