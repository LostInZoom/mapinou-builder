import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Style } from "ol/style";
import { getVectorContext } from "ol/render";
import { LineString } from "ol/geom";

import Character from "./character.js";
import { Sprite } from "../cartography/sprite.js";
import { getColorsByClassNames } from "../utils/parse.js";
import { angle, buffer, randomPointInCircle } from "../cartography/analysis.js";

class Enemies {
    constructor(options) {
        this.options = options || {};
        this.enemies = [];
        if (this.options.coordinates) {
            this.options.coordinates.forEach((coords) => {
                let o = this.options;
                o['coordinates'] = coords;
                this.enemies.push(new Enemy(o));
            });
        }
    }

    display() {
        this.enemies.forEach((enemy) => { enemy.display(); })
    }

    hide() {
        this.enemies.forEach((enemy) => { enemy.hide(); })
    }

    setOrientation(coordinates) {
        this.enemies.forEach((enemy) => { enemy.setOrientation(coordinates); })
    }

    getEnemies() {
        return this.enemies;
    }
}

class Enemy extends Character {
    constructor(options) {
        super(options);
        this.sprite = new Sprite({
            type: 'dynamic',
            layer: this.layer,
            src: './sprites/snake.png',
            width: 64,
            height: 64,
            scale: .8,
            anchor: [0.5, 0.7],
            framerate: 300,
            coordinates: this.coordinates,
            states: {
                idle: {
                    north: { line: 0, length: 3 },
                    east: { line: 1, length: 3 },
                    south: { line: 2, length: 3 },
                    west: { line: 3, length: 3 },
                }
            }
        });

        let sizeArea = this.basemap.params.game.tolerance.pitfalls;
        this.area = new VectorLayer({
            source: new VectorSource({
                features: [
                    new Feature({ geometry: buffer(this.coordinates, sizeArea) })
                ],
            }),
            style: new Style({
                fill: new Fill({
                    color: getColorsByClassNames('pitfalls-transparent')['pitfalls-transparent']
                })
            }),
            zIndex: this.zIndex - 1,
            updateWhileAnimating: true,
            updateWhileInteracting: true,
            minZoom: 13,
            opacity: 0,
        });

        this.basemap.map.addLayer(this.area);
        this.basemap.layers.push(this.area);

        // this.roam(this.coordinates, sizeArea);
    }

    display() {
        this.sprite.icon.setOpacity(1);
        this.area.setOpacity(1);
    }

    hide() {
        this.sprite.icon.setOpacity(0);
        this.area.setOpacity(0);
    }

    roam(coordinates, radius) {
        this.sprite.setState('idle');

        let destination = randomPointInCircle(this.coordinates, radius);
        let a = angle(coordinates, destination);
        this.sprite.setDirectionFromAngle(a);

        const line = new LineString([ coordinates, destination ]);
        const length = line.getLength();
        const speed = this.params.game.speed.roaming;
        const position = this.sprite.getGeometryClone();
        this.sprite.setGeometry(null);

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
                self.sprite.setGeometry(position);
                self.roam(destination, radius);
            }
        }
    }
}

export { Enemies, Enemy };