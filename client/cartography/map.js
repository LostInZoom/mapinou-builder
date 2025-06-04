import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { extend } from 'ol/extent.js';
import { Feature } from 'ol';
import { defaults as defaultInteractions } from 'ol/interaction/defaults.js';
import { Point, LineString } from 'ol/geom.js';
import TileLayer from 'ol/layer/Tile.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';

import { buffer, middle, project, within } from './analysis.js';
import { addClass, addSVG, makeDiv, removeClass, wait } from '../utils/dom.js';
// import { MapLayers, Player, Enemy, Target } from './layers.js';
import { unByKey } from 'ol/Observable.js';
import { inAndOut } from 'ol/easing.js';
import Score from './score.js';
import Router from './routing.js';
import { getVectorContext } from 'ol/render.js';

import { Enemies } from '../characters/enemies.js';
import Player from '../characters/player.js';
import Target from '../characters/target.js';
import { Helpers } from '../characters/helpers.js';
import { Music } from '../utils/audio.js';

class Basemap {
    constructor(options, loaded) {
        this.options = options || {};
        loaded = loaded || function () {};

        let page = this.options.page;
        this.params = page.app.params;

        this.container = makeDiv(null, 'map');
        if (options.class) { addClass(this.container, options.class); }
        page.container.append(this.container);

        this.mask = makeDiv(null, 'mask mask-map');
        this.loader = makeDiv(null, 'loader');
        this.mask.append(this.loader);
        this.container.append(this.mask);

        this.view = new View({
            center: options.center,
            zoom: options.zoom,
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
        });

        this.map = new Map({
            target: this.container,
            layers: [ this.baselayer ],
            view: this.view,
            interactions: new defaultInteractions({
                altShiftDragRotate: false,
                altShiftDragRotate: false,
                doubleClickZoom: false,
                keyboard: false,
                mouseWheelZoom: false,
                shiftDragZoom: false,
                dragPan: false,
                pinchRotate: false,
                pinchZoom: false,
                pointerInteraction: false,
            }),
        });

        this.map.once('loadend', () => {
            this.loaded();
            wait(200, () => {
                loaded();
            });
        });
    }

    setCenter(center) {
        this.view.setCenter(center);
    }

    setZoom(zoom) {
        this.view.setZoom(zoom);
    }

    loading() {
        removeClass(this.mask, 'loaded');
    }

    loaded() {
        addClass(this.mask, 'loaded');
    }

    initialize(callback) {
        

        
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

    setCenter(center) {
        this.view.setCenter(center);
    }

    setZoom(zoom) {
        this.view.setZoom(zoom);
    }

    setGeometry(name, position) {
        this.layers.setGeometry(name, new Point(position))
    }

    setPlayer(position) {
        this.layers.setGeometry('player', new Point(position))
    }

    setTarget(position) {
        this.layers.setGeometry('target', new Point(position))
    }

    setPath(vertexes) {
        this.layers.setGeometry('path', new LineString(vertexes))
    }

    isVisible(position, padding) {
        let visible = false;
        let size = this.map.getSize();
        let [minx, maxy] = this.map.getCoordinateFromPixel([ padding, padding ]);
        let [maxx, miny] = this.map.getCoordinateFromPixel([ size[0] - padding, size[1] - padding ]);
        let [x, y] = position;
        if (x > minx && x < maxx && y > miny && y < maxy) { visible = true; }
        return visible;
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

    activate() {
        addClass(this.container, 'active');
    }

    deactivate() {
        removeClass(this.container, 'active');
    }

    loading() {
        removeClass(this.mask, 'loaded');
    }

    loaded() {
        addClass(this.mask, 'loaded');
    }

    routing() {
        this.routable = true;
        removeClass(this.modebutton, 'collapse');
    }

    navigation() {
        this.routable = false;
        addClass(this.modebutton, 'collapse');
    }

    addPoint(layer, coordinates, index=null) {
        let feature = new Feature({
            type: layer,
            geometry: new Point(coordinates)
        });
        if ( index !== null ) { feature.setId(index); }
        this.layers.addFeature(layer, feature);
    }

    addZone(layer, coordinates, size, index=null) {
        let feature = new Feature({
            type: layer,
            geometry: buffer(coordinates, size)
        });
        if ( index !== null ) { feature.setId(index); }
        this.layers.addFeature(layer, feature);
    }

    fit(padding, transition, callback) {
        let extent = this.getExtentForData();
        this.map.getView().fit(extent, {
            padding: [ padding, padding, padding, padding ],
            duration: transition,
            easing: inAndOut,
            callback: callback
        });
    }

    initialize() {
        this.container = makeDiv(null, 'map map-' + this.type);
        this.page.container.append(this.container);
        this.mask = makeDiv(null, 'mask-map mask');
        this.loader = makeDiv(null, 'loader');
        this.mask.append(this.loader);
        this.container.append(this.mask);

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
        });

        this.modebutton = makeDiv(null, 'game-mode collapse');
        addSVG(this.modebutton, new URL('../assets/routing.svg', import.meta.url));
        this.container.append(this.modebutton);

        let interactions = {
            altShiftDragRotate: false,
            altShiftDragRotate: false,
            doubleClickZoom: false,
            keyboard: false,
            mouseWheelZoom: false,
            shiftDragZoom: false,
            dragPan: false,
            pinchRotate: false,
            pinchZoom: false,
            pointerInteraction: false,
        }

        if (this.interactable) {
            interactions.mouseWheelZoom = true;
            interactions.dragPan = true;
            interactions.pinchZoom = true;
            interactions.pointerInteraction = true;
        }

        this.map = new Map({
            target: this.container,
            layers: [ this.baselayer ],
            view: this.view,
            interactions: new defaultInteractions(interactions),
        });

        this.map.once('loadend', () => {
            this.loaded();
        });
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
            coordinates: this.options.bonus,
            zIndex: 30,
            minZoom: 13.5,
        });

        this.enemies = new Enemies({
            basemap: this,
            coordinates: this.options.pitfalls,
            zIndex: 20,
        });

        this.player.setOrientation(this.target.getCoordinates());
        this.enemies.setOrientation(this.player.getCoordinates());

        // this.layers.add('player', 50);
        // this.layers.add('target', 51);
        // this.layers.add('path', 10);

        // this.layers.add('pitfalls', 49);
        // this.layers.setMaxZoom('pitfalls', 12);

        // this.layers.add('pitfallsArea', 48);
        // this.layers.setMinZoom('pitfallsArea', 12);

        // this.layers.add('bonus', 47);
        // this.layers.setMaxZoom('bonus', 12);

        // this.layers.add('bonusArea', 46);
        // this.layers.setMinZoom('bonusArea', 12);

        // this.map.addLayer(this.layers.getLayer('player'));
        // this.map.addLayer(this.layers.getLayer('path'));
        // this.map.addLayer(this.layers.getLayer('target'));
        // this.map.addLayer(this.layers.getLayer('pitfalls'));
        // this.map.addLayer(this.layers.getLayer('pitfallsArea'));
        // this.map.addLayer(this.layers.getLayer('bonus'));
        // this.map.addLayer(this.layers.getLayer('bonusArea'));

        this.visiblebonus = []

        this.setCenter(this.options.start.center);
        this.setZoom(this.options.start.zoom);
    }

    phase1(callback) {
        this.phase = 1;
        let player = this.options.player;

        this.hints = this.options.hints;
        this.hint = makeDiv(null, 'game-hint');
        this.hintext = makeDiv(null, 'game-hint-text collapse ' + this.params.interface.theme);
        this.hint.append(this.hintext);
        this.page.themed.push(this.hintext);
        this.container.append(this.hint);

        let hintlistener = this.map.on('postrender', () => {
            let visible = this.isVisible(player, 50);
            let zoom = this.view.getZoom();
            for (let minzoom in this.hints) {
                if (!visible) {
                    this.hintext.innerHTML = 'Come back, you are getting lost!';
                } else {
                    if (zoom >= minzoom) {
                        removeClass(this.hintext, 'collapse');
                        this.hintext.innerHTML = this.hints[minzoom];
                    }
                }
            }
        });

        let doublelistener = this.map.on('dblclick', (e) => {
            let target = this.map.getEventCoordinate(event);
            if (within(target, player, this.params.game.tolerance.target)) {
                unByKey(hintlistener);
                unByKey(doublelistener);
                addClass(this.hintext, 'collapse');
                wait(200, () => { this.hintext.remove(); })
                callback();
            } else {
                if (!this.activeclue) {
                    this.activeclue = true;
                    addClass(this.clue, 'active');
                    wait(500, () => {
                        removeClass(this.clue, 'active');
                        this.activeclue = false;
                    })
                }
            }
        });
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