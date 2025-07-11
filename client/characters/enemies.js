import { getVectorContext } from "ol/render";
import { LineString } from "ol/geom";

import Character from "./character.js";
import { angle, buffer, bufferAroundPolygon, randomPointInCircle } from "../cartography/analysis.js";
import Sprite from "../cartography/sprite.js";
import { wait } from "../utils/dom.js";
import { distance } from "ol/coordinate.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import { Feature } from "ol";
import { getColorsByClassNames } from "../utils/parse.js";
import { Fill, Stroke, Style } from "ol/style.js";
import { unByKey } from "ol/Observable.js";
import { remap } from "../utils/math.js";

class Enemies {
    constructor(options) {
        this.options = options || {};
        this.params = this.options.basemap.params;

        this.enemies = [];
        if (this.options.coordinates) {
            this.options.coordinates.forEach((coords) => {
                let o = this.options;
                o.coordinates = coords;
                this.enemies.push(new Enemy(o));
            });
        }
    }

    setOrientation(coordinates) {
        this.enemies.forEach((enemy) => { enemy.setOrientation(coordinates); })
    }

    getEnemies() {
        return this.enemies;
    }

    spawn(duration, callback) {
        callback = callback || function () {};
        let increment = duration / this.enemies.length;
        let delay = 0;
        this.enemies.forEach((enemy) => {
            wait(delay, () => { enemy.spawn(); })
            delay += increment;
        });
        wait(delay + 300, callback);
    }

    roam() {
        this.enemies.forEach((enemy) => { enemy.roam(enemy.getCoordinates(), this.params.game.tolerance.enemies); })
    }

    distanceOrder(coordinates) {
        this.enemies = this.enemies.sort((a, b) => {
            return distance(a.getCoordinates(), coordinates) - distance(b.getCoordinates(), coordinates);
        });
    }
}

class Enemy extends Character {
    constructor(options) {
        super(options);
        this.states = {
            idle: {
                north: { line: 0, length: 3 },
                east: { line: 1, length: 3 },
                south: { line: 2, length: 3 },
                west: { line: 3, length: 3 },
            }
        }

        this.sprite = new Sprite({
            type: 'dynamic',
            layer: this.layer,
            src: './sprites/snake.png',
            width: 64,
            height: 64,
            scale: 0.8,
            anchor: [0.5, 0.7],
            framerate: 300,
            coordinates: this.coordinates,
            states: this.states
        }, () => {
            this.sprite.animate();
        });

        let colors = getColorsByClassNames('enemies-map', 'enemies-map-transparent');

        let sizeArea = this.basemap.params.game.tolerance.enemies;
        this.width1 = 50;
        this.width2 = 10;

        let b1 = buffer(this.coordinates, sizeArea - this.width1);
        let coords1 = b1.getLinearRings()[0].getCoordinates();
        this.border1 = new Feature({ geometry: bufferAroundPolygon(coords1, this.width1) });
        this.style1 = new Style({
            fill: new Fill({ color: colors['enemies-map-transparent'] })
        });
        this.border1.setStyle(this.style1);

        let b2 = buffer(this.coordinates, sizeArea - this.width2);
        let coords2 = b2.getLinearRings()[0].getCoordinates();
        this.border2 = new Feature({ geometry: bufferAroundPolygon(coords2, this.width2) });
        this.style2 = new Style({
            fill: new Fill({ color: colors['enemies-map'] })
        });
        this.border2.setStyle(this.style2);

        this.area = new VectorLayer({
            source: new VectorSource({
                features: [ this.border1, this.border2 ],
            }),
            zIndex: this.zIndex - 1,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            opacity: 0,
        });

        this.areaVisible = false;

        this.basemap.map.addLayer(this.area);
        this.basemap.layers.push(this.area);

        this.listener = this.basemap.map.on('postrender', () => {
            let threshold = this.params.game.routing;
            let zoom = this.basemap.view.getZoom();
            if (zoom >= threshold && !this.areaVisible) {
                this.areaVisible = true;
                this.reveal();
            }
            else if (zoom < threshold && this.areaVisible) {
                this.areaVisible = false;
                this.hide();
            }
        });
    }

    reveal(callback) {
        this.stopAnimation();
        this.animateOpacity(1, callback);
    }

    hide(callback) {
        this.stopAnimation();
        this.animateOpacity(0, callback);
    }

    stopAnimation() {
        if (this.animation) { unByKey(this.animation); }
    }

    animateOpacity(value, callback) {
        callback = callback || function () {};
        let opacity = this.area.getOpacity();
        const difference = value - opacity;
        const increment = difference > 0 ? 0.08 : -0.08;

        if (difference === 0) {
            callback();
        } else {
            this.animation = this.area.on('postrender', () => {
                opacity += increment;
                this.area.setOpacity(opacity);
                let stop = false;
                if (difference > 0 && opacity >= value) { stop = true; }
                else if (difference < 0 && opacity <= value) { stop = true; }

                if (stop) {
                    this.stopAnimation();
                    callback();
                } else {
                    // Render the map to trigger the listener
                    this.basemap.map.render();
                }
            });
        }
    }
    


    

    roam(coordinates, radius) {
        this.sprite.setState('idle');

        let destination = randomPointInCircle(this.coordinates, radius);
        let a = angle(coordinates, destination);
        this.sprite.setDirectionFromAngle(a);

        const line = new LineString([ coordinates, destination ]);
        const length = line.getLength();
        const speed = this.params.game.speed.enemies;
        const position = this.sprite.getGeometryClone();
        this.sprite.hide();

        let lastTime = Date.now();
        let distance = 0;
        let newPosition = position.getCoordinates();

        this.layer.on('postrender', animate);

        let self = this;
        function animate(event) {
            const time = event.frameState.time;
            const context = getVectorContext(event);
            context.setStyle(self.sprite.style);

            const elapsed = (time - lastTime) / 1000;

            distance += speed * elapsed * self.basemap.view.getResolution();
            lastTime = time;

            // If the travelled distance is below the length of the route, continue the animation
            if (distance < length) {
                newPosition = line.getCoordinateAt(distance / length);
                position.setCoordinates(newPosition);
                context.drawGeometry(position);
                self.basemap.map.render();
            }
            else {
                self.layer.un('postrender', animate);
                position.setCoordinates(destination);
                context.drawGeometry(position);
                self.sprite.display();
                self.roam(destination, radius);
            }
        }
    }
}

export { Enemies, Enemy };