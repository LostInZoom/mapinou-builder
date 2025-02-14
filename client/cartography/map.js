import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { extend } from 'ol/extent.js';
import { Feature } from 'ol';
import { defaults as defaultInteractions } from 'ol/interaction/defaults.js';
import { Point, LineString } from 'ol/geom.js';

import { buffer, middle, within } from './analysis.js';
import { addClass, addSVG, makeDiv, removeClass, wait } from '../utils/dom.js';
import { MapLayers } from './layers.js';
import Page from '../interface/page.js';

class Basemap {
    constructor(page) {
        this.page = page;
        this.params = page.app.params;
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
        let extent;
        for (let name in this.layers.getLayers()) {
            if (extent === undefined) { extent = this.layers.getLayer(name).getSource().getExtent() }
            else { extent = extend(extent, this.layers.getLayer(name).getSource().getExtent()) }
        }
        let size = this.map.getSize();
        let padded = [ size[0] - 2*padding, size[1] - 2*padding ]
        let res = this.view.getResolutionForExtent(extent, padded);
        let zoom = this.view.getZoomForResolution(res);
        return zoom;
    }

    getCenterForData() {
        let extent;
        for (let name in this.layers.getLayers()) {
            if (extent === undefined) { extent = this.layers.getLayer(name).getSource().getExtent() }
            else { extent = extend(extent, this.layers.getLayer(name).getSource().getExtent()) }
        }
        return middle([extent[0], extent[1]], [extent[2], extent[3]])
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
        removeClass(this.modebutton, 'collapse');
    }

    navigation() {
        addClass(this.modebutton, 'collapse');
    }

    addPoint(layer, coordinates) {
        let feature = new Feature({
            type: layer,
            geometry: new Point(coordinates)
        });
        this.layers.addFeature(layer, feature);
    }

    addZone(layer, coordinates) {
        let feature = new Feature({
            type: layer,
            geometry: buffer(coordinates, this.params.game.tolerance.pitfall)
        });
        this.layers.addFeature(layer, feature);
    }

    initialize() {
        this.container = makeDiv(null, 'map map-' + this.type);
        this.page.container.append(this.container);
        this.mask = makeDiv(null, 'mask-map mask ' + this.page.getTheme());
        this.page.themed.push(this.mask);
        this.loader = makeDiv(null, 'loader');
        this.mask.append(this.loader);
        this.container.append(this.mask);

        this.view = new View();
        this.layers = new MapLayers();
        this.layers.setBaseLayer();

        this.modebutton = makeDiv(null, 'game-mode collapse ' + this.page.getTheme());
        addSVG(this.modebutton, new URL('../img/routing.svg', import.meta.url));
        this.page.themed.push(this.modebutton);
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
            layers: [ this.layers.getBaseLayer() ],
            view: this.view,
            interactions: new defaultInteractions(interactions),
        });

        this.map.once('loadend', () => {
            this.loaded();
        });
    }
};

class MenuMap extends Basemap {
    constructor(page) {
        super(page);
        this.type = 'menu';
        this.interactable = false;
        this.initialize();

        this.map.on('postrender', () => {
            let zoom = this.view.getZoom();
            if (zoom >= this.params.game.routing) { this.routing(); }
            else { this.navigation(); }
        });
    }
}

class GameMap extends Basemap {
    constructor(page) {
        super(page);
        this.type = 'game';
        this.interactable = true;
        this.initialize();

        this.clue = makeDiv(null, 'game-visual-clue');
        this.container.append(this.clue);

        this.pitfalls = []

        this.layers.add('player', 50);
        this.layers.add('target', 51);
        this.layers.add('path', 10);

        this.layers.add('pitfalls', 49);
        this.layers.setMaxZoom('pitfalls', 12);

        this.layers.add('pitfallsArea', 48);
        this.layers.setMinZoom('pitfallsArea', 12);

        this.map.addLayer(this.layers.getLayer('player'));
        this.map.addLayer(this.layers.getLayer('path'));
        this.map.addLayer(this.layers.getLayer('target'));
        this.map.addLayer(this.layers.getLayer('pitfalls'));
        this.map.addLayer(this.layers.getLayer('pitfallsArea'));

        this.player = this.params.tutorial.player;
        this.hints = this.params.tutorial.hints;

        this.hint = makeDiv(null, 'game-hint');
        this.hintext = makeDiv(null, 'game-hint-text collapse ' + this.params.interface.theme);
        this.hint.append(this.hintext);
        this.page.themed.push(this.hintext);
        this.container.append(this.hint);

        this.map.on('postrender', () => {
            let visible = this.isVisible(this.player, 50);
            let zoom = this.view.getZoom();
            if (zoom >= this.params.game.routing) { this.routing(); }
            else { this.navigation(); }

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

        this.activeclue = false;

        this.map.on('dblclick', (e) => {
            let target = this.map.getEventCoordinate(event);
            if (within(target, this.player, this.params.game.tolerance.target)) {
                if (!this.page.app.sliding) {
                    this.page.app.tutorial2(this.page.app.next);
                    this.page.app.slideNext(() => {
                        this.page.app.next = new Page(this.page.app, 'next');
                    });
                }
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

    addPitfall(coordinates) {
        let pitfall = new Feature({
            type: 'pitfalls',
            geometry: new Point(coordinates)
        });
        this.pitfalls.push(pitfall);
        this.pitfallsLayer.getSource().addFeature(pitfall);

        let area = new Feature({
            type: 'pitfallsArea',
            geometry: buffer(coordinates, 500)
        });
        this.pitfallsAreaLayer.getSource().addFeature(area);
    }
}

export { Basemap, GameMap, MenuMap };