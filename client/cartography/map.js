import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { extend } from 'ol/extent.js';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom.js';
import TileLayer from 'ol/layer/Tile.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';

import { defaults } from 'ol/interaction/defaults.js';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom.js';
import DragPan from 'ol/interaction/DragPan.js';
import PinchZoom from 'ol/interaction/PinchZoom.js';
import PointerInteraction from 'ol/interaction/Pointer.js';

import { angle, buffer, middle, project, within } from './analysis.js';
import { addClass, addSVG, makeDiv, removeClass, wait } from '../utils/dom.js';
// import { MapLayers, Player, Enemy, Target } from './layers.js';
import { unByKey } from 'ol/Observable.js';
import { inAndOut } from 'ol/easing.js';
import Score from './score.js';
import Router from './routing.js';
import { getVectorContext } from 'ol/render.js';

import { Enemies, Enemy } from '../characters/enemies.js';
import Player from '../characters/player.js';
import Target from '../characters/target.js';
import { Helper, Helpers } from '../characters/helpers.js';
import { Music } from '../utils/sounds.js';
import Position from '../game/position.js';

class Basemap {
    constructor(options, callback) {
        callback = callback || function () {};
        this.options = options || {};
        this.params = options.app.options;
        
        this.layers = [];
        this.parent = this.options.parent;

        this.container = makeDiv(null, 'map');
        if (options.class) { addClass(this.container, options.class); }
        this.parent.append(this.container);

        this.view = new View({});

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

        this.interactions = defaults();
        this.map = new Map({
            target: this.container,
            layers: [ this.baselayer ],
            view: this.view,
            loadTilesWhileAnimating: true,
            loadTilesWhileInteracting: true,
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

    animate(options, callback) {
        callback = callback || function () {};
        this.view.animate(options, callback);
    }

    fit(extent, options, callback) {
        options.callback = callback;
        this.map.getView().fit(extent, options);
    }

    isVisible(position, padding=50) {
        let visible = false;
        let size = this.map.getSize();
        let [minx, maxy] = this.map.getCoordinateFromPixel([ padding, padding ]);
        let [maxx, miny] = this.map.getCoordinateFromPixel([ size[0] - padding, size[1] - padding ]);
        let [x, y] = position;
        if (x > minx && x < maxx && y > miny && y < maxy) { visible = true; }
        return visible;
    }

    setInteractions(interactable=false) {
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

    removeLayers() {
        this.layers.forEach(layer => { this.map.removeLayer(layer); })
    }

    createCharacters(level, options) {
        this.player = new Player({
            basemap: this,
            level: level,
            coordinates: options.player,
            orientable: true,
            zIndex: 50
        });
        this.player.setOrientation(options.target)

        this.target = new Target({
            basemap: this,
            level: level,
            colors: [ 'brown', 'sand', 'grey' ],
            color: 'random',
            coordinates: options.target,
            orientable: true,
            zIndex: 40
        });

        this.helpers = new Helpers({
            basemap: this,
            level: level,
            coordinates: options.helpers,
            minZoom: this.params.game.routing,
            orientable: false,
            zIndex: 30,
        });

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
        callback = callback || function () {};

        let movement = this.map.on('click', () => {
            if (this.routable) {
                let destination = this.map.getEventCoordinate(event);
                this.player.travel(destination, callback);
            }
        });
        this.listeners.push(movement);

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
        this.listeners.push(routing);
    }

    addListeners(...listeners) {
        listeners.forEach(l => { this.listeners.push(l); });
    }

    removeListeners() {
        this.listeners.forEach((listener) => { unByKey(listener); });
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
        callback = callback || function() {};
        if (this.routable) { callback(); }
        else {
            this.routable = true;
            addClass(this.maskcontainer, 'routable');
            wait(500, callback);
        }
    }

    makeUnroutable(callback) {
        callback = callback || function() {};
        if (!this.routable) { callback(); }
        else {
            this.routable = false;
            removeClass(this.maskcontainer, 'routable');
            wait(500, callback);
        }
    }

    clear(callback) {
        callback = callback || function() {};
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










class Basemap1 {
    constructor(page) {
        this.page = page;
        this.params = page.app.params;
        this.routable = false;
        this.moving = false;
        this.layers = [];
    }

    getZoomForData(padding) {
        let extent = this.getExtentForData();
        let size = this.map.getSize();
        let padded = [ size[0] - 2*padding, size[1] - 2*padding ]
        let res = this.view.getResolutionForExtent(extent, padded);
        let zoom = this.view.getZoomForResolution(res);
        return zoom;
    }

    getCenterForData() {
        let extent = this.getExtentForData();
        return middle([extent[0], extent[1]], [extent[2], extent[3]])
    }

    getExtentForData() {
        let extent;
        this.layers.forEach((layer) => {
            if (extent === undefined) { extent = layer.getSource().getExtent() }
            else { extent = extend(extent, layer.getSource().getExtent()) }
        })
        return extent;
    }
};

class MenuMap extends Basemap {
    constructor(page, mode) {
        super(page);
        this.mode = mode;
        this.type = 'menu';
        this.interactable = false;
        this.initialize();

        if (this.mode) {
            this.map.on('postrender', () => {
                let zoom = this.view.getZoom();
                if (zoom >= this.params.game.routing) { this.routing(); }
                else { this.navigation(); }
            });
        }
    }
}

class GameMap extends Basemap {
    constructor(page, options) {
        super(page);
        this.options = options || {};
        this.type = 'game';
        this.phase;
        this.travelled = 0;
        this.statspitfalls = 0;
        this.statsbonus = 0;

        this.interactable = true;
        this.activeclue = false;

        this.initialize();

        this.clue = makeDiv(null, 'game-visual-clue');
        this.container.append(this.clue);

        this.player = new Player({
            basemap: this,
            coordinates: this.options.player,
            zIndex: 50
        });

        this.target = new Target({
            basemap: this,
            coordinates: this.options.target,
            zIndex: 40
        });

        this.helpers = new Helpers({
            basemap: this,
            coordinates: this.options.helpers,
            zIndex: 30,
            minZoom: 13.5,
        });

        this.enemies = new Enemies({
            basemap: this,
            coordinates: this.options.enemies,
            zIndex: 20,
        });

        this.player.setOrientation(this.target.getCoordinates());
        this.enemies.setOrientation(this.player.getCoordinates());

        this.visiblebonus = []

        this.setCenter(this.options.start.center);
        this.setZoom(this.options.start.zoom);
    }

    phase2(callback) {
        this.phase = 2;
        // this.music = new Music({
        //     src: './assets/sounds/theme',
        //     format: 'mp3',
        // });
        // this.music.play(true);

        this.player.display();
        this.target.display();
        this.enemies.display();
        this.helpers.display();

        this.pitfall = false;
        this.bonus = false;
        this.scorecontainer = makeDiv(null, 'score-container');
        this.scoretext = makeDiv(null, 'score-text ' + this.params.interface.theme, 0);
        this.scorecontainer.append(this.scoretext);
        this.container.append(this.scorecontainer);

        let increment = this.params.game.score.increments.default;
        let interval = this.params.game.score.intervals.default;
        this.score = new Score(0, increment, interval, this.scoretext);
        this.router = new Router(this, this.options.player);

        // this.setPlayer(this.options.player);
        // this.setTarget(this.options.target);
        // this.addPitfall(this.options.pitfalls);
        
        this.fit(30, 500, () => {
            this.map.on('postrender', () => {
                let zoom = this.view.getZoom();
                if (zoom >= this.params.game.routing) { this.routing(); }
                else { this.navigation(); }
            });
    
            this.score.start();
            this.activateMovement(() => {
                let stats = {
                    distance: this.travelled,
                    score: this.score.get(),
                    pitfalls: this.statspitfalls,
                    bonus: this.statsbonus,
                }
                callback(stats);
            });
        });
    }

    /**
     * This method activate a listener on the map click that allows
     * the player to move.
     */
    activateMovement(callback) {
        let movement = this.map.on('click', () => {
            if (this.routable) {
                let target = this.map.getEventCoordinate(event);
                this.router.calculateRoute(target, (route) => {
                    this.player.travel(route, (position, end) => {
                        this.router.setPosition(position);
                        if (end) {
                            unByKey(movement);
                            callback();
                        }
                    });
                });
            }
        });
    }

    pitfallsHandling(position) {
        let intersect = false; let index;
        for (let i = 0; i < this.options.pitfalls.length; i++) {
            if (within(position, this.options.pitfalls[i], this.params.game.tolerance.pitfalls)) { intersect = true; index = i; break; }
        }
        if (intersect) {
            if (!this.pitfall) {
                ++this.statspitfalls;
                this.score.add(this.params.game.score.modifiers.pitfalls);
                this.pitfall = true;
            }
        }
        else {
            if (this.pitfall) { this.pitfall = false; }
        }
    }

    bonusHandling(position) {
        let self = this;
        function removeBonus(index) {
            let source = self.layers.getLayer('bonus').getSource()
            let sourceArea = self.layers.getLayer('bonusArea').getSource()
            let f = source.getFeatureById(index);
            let fa = sourceArea.getFeatureById(index);
            source.removeFeature(f);
            sourceArea.removeFeature(fa);
        }

        for (let i = 0; i < this.options.bonus.length; i++) {
            let bonus = this.options.bonus[i];
            if (within(position, bonus, this.params.game.visibility.bonus)) {
                if (!this.visiblebonus.includes(i)) {
                    this.visiblebonus.push(i);
                    this.addZone('bonusArea', bonus, this.params.game.tolerance.bonus, i);
                    this.addPoint('bonus', bonus, i);
                }
            } else {
                if (this.visiblebonus.includes(i)) {
                    let j = this.visiblebonus.indexOf(i);
                    this.visiblebonus.splice(j, 1);
                    removeBonus(i);
                }
            }
        }

        let intersect = false; let index;
        for (let i = 0; i < this.options.bonus.length; i++) {
            let bonus = this.options.bonus[i];
            if (within(position, bonus, this.params.game.tolerance.bonus)) {
                intersect = true;
                index = i;
                break;
            }
        }

        if (intersect) {
            if (!this.bonus) {
                this.score.add(this.params.game.score.modifiers.bonus);
                this.bonus = true;
                ++this.statsbonus;
                removeBonus(index);
            }
        }
        else {
            if (this.bonus) { this.bonus = false; }
        }
    }
}

export { Basemap, GameMap, MenuMap };