import TileLayer from 'ol/layer/Tile.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { LineString, Point } from 'ol/geom.js';
import { Style } from 'ol/style.js';
import { getVectorContext } from 'ol/render.js';

import { MapStyles } from './styles.js';
import { Sprite } from './sprite.js';
import { scale } from 'ol/size.js';
import { angle, project, within } from './analysis.js';

class MapLayers {
    constructor() {
        this.styles = new MapStyles();
        this.baselayer;
        this.layers = {};
        this.features = {};
    }

    add(name, zindex, opacity=1) {
        this.features[name] = new Feature({ type: name });
        this.layers[name] = new VectorLayer({
            source: new VectorSource({
                features: [ this.features[name] ],
            }),
            style: this.styles.get(name),
            zIndex: zindex,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            opacity: opacity
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

    getLayers() {
        return this.layers;
    }

    getFeature(name) {
        return this.features[name];
    }

    getBaseLayer() {
        return this.baselayer;
    }

    getStyle(name) {
        return this.styles.styles[name];
    }
    
    addFeature(name, feature) {
        this.layers[name].getSource().addFeature(feature);
    }

    setGeometry(name, geometry) {
        this.features[name].setGeometry(geometry);
    }

    getGeometry(name) {
        return this.features[name].getGeometry();
    }

    setMaxZoom(name, zoom) {
        this.layers[name].setMaxZoom(zoom);
    }

    setMinZoom(name, zoom) {
        this.layers[name].setMinZoom(zoom);
    }
}

class MapElement {
    constructor(basemap) {
        this.basemap = basemap;
    }
}

class Player extends MapElement {
    constructor(basemap, coordinates) {
        super(basemap);
        this.type = 'player';
        this.params = basemap.params;
        this.coordinates = coordinates;
        this.layer = new VectorLayer({
            source: new VectorSource(),
            zIndex: 100,
            updateWhileAnimating: true,
            updateWhileInteracting: true
        });
        this.basemap.map.addLayer(this.layer);

        this.sprite = new Sprite({
            layer: this.layer,
            src: './assets/sprites/bird64.png',
            size: 64,
            scale: 1,
            framerate: 200,
            coordinates: this.coordinates,
        });

        this.moving = false;
        this.travelled = 0;
    }

    display() {
        this.sprite.icon.setOpacity(1);
    }

    hide() {
        this.sprite.icon.setOpacity(0);
    }

    move(route, callback) {
        callback = callback || function () {};
        if (!this.moving) {
            let increment = this.params.game.score.increments.movement;
            let interval = this.params.game.score.intervals.movement; 
            this.basemap.score.change(increment, interval);

            this.sprite.setState('move');
            
            // Retrieve the vertexes composing the calculated route
            const vertexes = [];
            const nodes = route.geometry.coordinates;
            for (let i = 0; i < nodes.length; i++) {
                vertexes.push(project('4326', '3857', nodes[i]));
            }
            
            const destination = vertexes[vertexes.length - 1];
            
            // Create the path line and calculate its length
            const line = new LineString(vertexes);
            const length = line.getLength();

            let lastTime = Date.now();
            let distance = 0;

            // Get the speed in meters/second
            const speed = this.params.game.speed / 3.6;
            const position = this.sprite.getGeometryClone();

            this.sprite.setGeometry(null);
            this.layer.on('postrender', animatePlayer);

            let self = this;
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

                    let a = angle(position.getCoordinates(), newPosition);
                    self.sprite.setDirection(a);

                    // self.pitfallsHandling(newPosition);
                    // self.bonusHandling(newPosition);

                    let win = false;
                    
                    // if (within(newPosition, self.options.target, self.params.game.tolerance.target)) { win = true; }

                    // if (path === undefined) { path = new LineString([ vertexes[0], newPosition ]); }
                    // else { path.appendCoordinate(newPosition); }

                    // // context.setStyle(self.layers.getStyle(['path']));
                    // context.drawGeometry(path);

                    position.setCoordinates(newPosition);
                    context.setStyle(self.sprite.style);
                    context.drawGeometry(position);

                    // Render the map to trigger the listener
                    self.basemap.map.render();

                    if (win) { stopAnimation(context, true); }
                }
                // Here, the journey is over
                else { stopAnimation(context, false); }
            }

            function stopAnimation(context, end) {
                // Redraw on context to avoid flickering
                // context.setStyle(self.layers.getStyle(['path']));
                // context.drawGeometry(path);

                context.setStyle(self.sprite.style);
                context.drawGeometry(position);

                // self.layers.setGeometry('player', position);
                self.sprite.setGeometry(position);
                self.sprite.setDirection('');
                self.sprite.setState('idle');
                // self.layers.setGeometry('path', path);

                // Removing the render listener
                self.layer.un('postrender', animatePlayer);

                let increment = self.params.game.score.increments.default;
                let interval = self.params.game.score.intervals.default; 
                self.basemap.score.change(increment, interval);
                self.travelled += distance;
                console.log('end');

                callback(destination, end);
            }
        }
    }
}

class Target extends MapElement {
    constructor(basemap) {
        super(basemap);
        this.type = 'target';
    }
}

class Pitfalls extends MapElement {
    constructor(basemap) {
        super(basemap);
        this.type = 'pitfalls';
    }
}

class Bonus extends MapElement {
    constructor(basemap) {
        super(basemap);
        this.type = 'bonus';
    }
}

export { MapLayers, Player, Target, Pitfalls, Bonus };