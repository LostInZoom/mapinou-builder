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
import { inAndOut } from 'ol/easing.js';
import Score from './score.js';
import Router from './routing.js';
import { getVectorContext } from 'ol/render.js';

class Basemap {
    constructor(page) {
        this.page = page;
        this.params = page.app.params;
        this.routable = false;
        this.moving = false;
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
        for (let name in this.layers.getLayers()) {
            if (extent === undefined) { extent = this.layers.getLayer(name).getSource().getExtent() }
            else { extent = extend(extent, this.layers.getLayer(name).getSource().getExtent()) }
        }
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
        this.mask = makeDiv(null, 'mask-map mask ' + this.page.getTheme());
        this.page.themed.push(this.mask);
        this.loader = makeDiv(null, 'loader ' + this.page.getTheme());
        this.page.themed.push(this.loader);
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
        this.options = options;
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

        this.layers.add('player', 50);
        this.layers.add('target', 51);
        this.layers.add('path', 10);

        this.layers.add('pitfalls', 49);
        this.layers.setMaxZoom('pitfalls', 12);

        this.layers.add('pitfallsArea', 48);
        this.layers.setMinZoom('pitfallsArea', 12);

        this.layers.add('bonus', 47);
        this.layers.setMaxZoom('bonus', 12);

        this.layers.add('bonusArea', 46);
        this.layers.setMinZoom('bonusArea', 12);

        this.map.addLayer(this.layers.getLayer('player'));
        this.map.addLayer(this.layers.getLayer('path'));
        this.map.addLayer(this.layers.getLayer('target'));
        this.map.addLayer(this.layers.getLayer('pitfalls'));
        this.map.addLayer(this.layers.getLayer('pitfallsArea'));
        this.map.addLayer(this.layers.getLayer('bonus'));
        this.map.addLayer(this.layers.getLayer('bonusArea'));

        this.visiblebonus = []

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

        this.setPlayer(this.options.player);
        this.setTarget(this.options.target);
        this.addPitfall(this.options.pitfalls);
        
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

    addPitfall(coordinates) {
        for (let i = 0; i < coordinates.length; i++) {
            this.addZone('pitfallsArea', coordinates[i], this.params.game.tolerance.pitfalls, i);
            this.addPoint('pitfalls', coordinates[i], i);
        }
    }

    addBonus(coordinates) {
        for (let i = 0; i < coordinates.length; i++) {
            this.addZone('bonusArea', coordinates[i], this.params.game.tolerance.bonus, i);
            this.addPoint('bonus', coordinates[i], i);
        }
    }

    /**
     * This method activate a listener on the map click that allows
     * the player to move.
     */
    activateMovement(callback) {
        let movement = this.map.on('click', () => {
            // Allow movement only if routing is active
            if (this.routable && !this.moving) {
                this.routable = false;
                this.moving = true;
                // Get the destination position
                let target = this.map.getEventCoordinate(event);
                console.log('start');

                // Calculate the route towards the destination
                this.router.calculateRoute(target, (result) => {
                    console.log('routing...');
                    let increment = this.params.game.score.increments.movement;
                    let interval = this.params.game.score.intervals.movement; 
                    this.score.change(increment, interval);
                    
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
                        let increment = self.params.game.score.increments.default;
                        let interval = self.params.game.score.intervals.default; 
                        self.score.change(increment, interval);
                        self.travelled += distance;
                        console.log('end');

                        if (end) {
                            unByKey(movement);
                            callback();
                        }
                        else {
                            self.routable = true;
                            self.moving = false;
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

                            self.pitfallsHandling(newPosition);
                            self.bonusHandling(newPosition);

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

                            if (win) { stopAnimation(context, true); }
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