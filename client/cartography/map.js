import Map from 'ol/Map.js';
import View from 'ol/View.js';
import { extend } from 'ol/extent.js';
import { Feature } from 'ol';
import { defaults as defaultInteractions } from 'ol/interaction/defaults.js';
import { Point, LineString } from 'ol/geom.js';

import { buffer, middle, project, within } from './analysis.js';
import { addClass, addSVG, makeDiv, removeClass, wait } from '../utils/dom.js';
import { MapLayers } from './layers.js';
import { unByKey } from 'ol/Observable.js';
import Score from './score.js';
import Router from './routing.js';
import { getVectorContext } from 'ol/render.js';

class Basemap {
    constructor(page) {
        this.page = page;
        this.params = page.app.params;
        this.routable = false;
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
        this.routable = true;
        removeClass(this.modebutton, 'collapse');
    }

    navigation() {
        this.routable = false;
        addClass(this.modebutton, 'collapse');
    }

    addPoint(layer, coordinates) {
        let feature = new Feature({
            type: layer,
            geometry: new Point(coordinates)
        });
        this.layers.addFeature(layer, feature);
    }

    addZone(layer, coordinates, size) {
        let feature = new Feature({
            type: layer,
            geometry: buffer(coordinates, size)
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
    constructor(page, options) {
        super(page);
        this.options = options;
        this.type = 'game';
        this.phase;

        this.interactable = true;
        this.activeclue = false;

        this.initialize();

        this.clue = makeDiv(null, 'game-visual-clue');
        this.container.append(this.clue);

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

        this.setCenter(this.options.start.center);
        this.setZoom(this.options.start.zoom);
    }

    phase1(callback) {
        this.phase = 1;
        this.player = this.options.player;
        this.hints = this.options.hints;
        this.hint = makeDiv(null, 'game-hint');
        this.hintext = makeDiv(null, 'game-hint-text collapse ' + this.params.interface.theme);
        this.hint.append(this.hintext);
        this.page.themed.push(this.hintext);
        this.container.append(this.hint);

        let hintlistener = this.map.on('postrender', () => {
            let visible = this.isVisible(this.player, 50);
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
            if (within(target, this.player, this.params.game.tolerance.target)) {
                unByKey(hintlistener);
                unByKey(doublelistener);
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
        this.pitfall = false;
        this.scoretext = makeDiv('score-text', 'button-game', 0);
        this.container.append(this.scoretext);
        this.score = new Score(0, 1, 1000, this.scoretext);

        this.router = new Router(this, this.options.player);

        this.setPlayer(this.options.player);
        this.setTarget(this.options.target);
        this.addPitfall(this.options.pitfalls);
        this.setCenter(this.getCenterForData());
        this.setZoom(this.getZoomForData(30));

        this.map.on('postrender', () => {
            let zoom = this.view.getZoom();
            if (zoom >= this.params.game.routing) { this.routing(); }
            else { this.navigation(); }
        });

        this.activateMovement(callback);
    }

    addPitfall(coordinates) {
        for (let i = 0; i < coordinates.length; i++) {
            let p = this.params.tutorial.pitfalls[i];
            this.addZone('pitfallsArea', p, this.params.game.tolerance.pitfall);
            this.addPoint('pitfalls', p);
        }
    }

    /**
     * This method activate a listener on the map click that allows
     * the player to move.
     */
    activateMovement(callback) {
        this.map.on('click', () => {
            // Allow movement only if routing is active
            if (this.routable) {
                this.routable = false;
                // Get the destination position
                let target = this.map.getEventCoordinate(event);
                console.log('start');

                // Calculate the route towards the destination
                this.router.calculateRoute(target, (result) => {
                    console.log('routing...');
                    this.score.change(1, 200);
                    
                    // Retrieve the vertexes composing the calculated route
                    const vertexes = [];
                    const nodes = result.geometry.coordinates;
                    for (let i = 0; i < nodes.length; i++) {
                        vertexes.push(project('4326', '3857', nodes[i]));
                    }
                    let destination = vertexes[vertexes.length - 1]
                    
                    // Create the path line and calculate its length
                    const line = new LineString(vertexes);
                    const length = line.getLength();

                    let lastTime = Date.now();
                    let distance = 0;

                    // Get the speed in meters/second
                    const speed = this.params.game.speed / 3.6;
                    const position = this.layers.getGeometry('player').clone();

                    let path = this.layers.getGeometry('path');
                    if (path !== undefined) { path = path.clone(); }

                    self = this;
                    function stopAnimation(context, end) {
                        // Redraw on context to avoid flickering
                        context.setStyle(self.layers.getStyle(['path']));
                        context.drawGeometry(path);
                        context.setStyle(self.layers.getStyle(['player']));
                        context.drawGeometry(position);

                        self.layers.setGeometry('player', position);
                        self.layers.setGeometry('path', path);

                        self.router.setPosition(destination);

                        // Removing the render listener
                        self.layers.getLayer('path').un('postrender', animatePlayer);
                        self.score.change(1, 1000);
                        console.log('end');

                        if (end) {
                            callback();
                        }
                        else {
                            self.routable = true;
                        }
                    }

                    function animatePlayer(event) {
                        // Get the current time
                        const time = event.frameState.time;
                        const context = getVectorContext(event);
                        // Calculate the elapsed time in seconds
                        const elapsed = (time - lastTime) / 1000;
                        // Calculate the distance traveled depending on the elapsed time and the speed
                        distance = distance + (elapsed * speed);
                        // Set the previous time as the current one
                        lastTime = time;

                        // If the travelled distance is below the length of the route, continue the animation
                        if (distance < length) {
                            // Calculate the position of the point along the route line
                            let newPosition = line.getCoordinateAt(distance / length);

                            let pit = false;
                            for (let i = 0; i < self.options.pitfalls.length; i++) {
                                // Check if current position if within a pitfall area
                                if (within(newPosition, self.options.pitfalls[i], self.params.game.tolerance.pitfall)) { pit = true; break; }
                            }
                            // If current position is within a pitfall area
                            if (pit) {
                                // If player is not already inside a pitfall area
                                if (!self.pitfall) {
                                    // Increment the score by 100 and set player as within pitfall area
                                    self.score.add(self.params.game.penalty.pitfall);
                                    self.pitfall = true
                                }
                            }
                            // Here current position is not within a pitfall area
                            else {
                                // If the player was previously in a pitfall area, set the player as outside pitfall
                                if (self.pitfall) { self.pitfall = false; }
                            }

                            let win = false;
                            if (within(newPosition, self.options.target, self.params.game.tolerance.target)) { win = true; }

                            if (path === undefined) { path = new LineString([ vertexes[0], newPosition ]); }
                            else { path.appendCoordinate(newPosition); }

                            context.setStyle(self.layers.getStyle(['path']));
                            context.drawGeometry(path);

                            position.setCoordinates(newPosition);
                            context.setStyle(self.layers.getStyle(['player']));
                            context.drawGeometry(position);

                            // Render the map to trigger the listener
                            self.map.render();

                            if (win) {
                                stopAnimation(context, true);
                            }
                        }
                        // Here, the journey is over
                        else { stopAnimation(context, false); }
                    }

                    this.layers.setGeometry('player', null);
                    this.layers.setGeometry('path', null);
                    this.layers.getLayer('path').on('postrender', animatePlayer);
                });
            }
        });
    }
}

export { Basemap, GameMap, MenuMap };