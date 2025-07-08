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

class Target extends Character {
    constructor(options) {
        super(options);
        this.sprite = new Sprite({
            type: 'dynamic',
            layer: this.layer,
            src: './sprites/rabbit-brown.png',
            width: 64,
            height: 64,
            scale: .8,
            framerate: 200,
            coordinates: this.coordinates,
            anchor: [0.5, 0.8],
            states: {
                idle: {
                    north: { line: 9, length: 4 },
                    east: { line: 10, length: 4 },
                    south: { line: 8, length: 4 },
                    west: { line: 11, length: 4 },
                },
                move: {
                    north: { line: 1, length: 4 },
                    east: { line: 2, length: 4 },
                    south: { line: 0, length: 4 },
                    west: { line: 3, length: 4 },
                },
                graze: {
                    north: { line: 5, length: 4 },
                    east: { line: 6, length: 4 },
                    south: { line: 4, length: 4 },
                    west: { line: 7, length: 4 },
                }
            }
        });
        
        this.roam(this.coordinates, this.params.game.tolerance.target);
    }

    display() {
        this.sprite.icon.setOpacity(1);
    }

    hide() {
        this.sprite.icon.setOpacity(0);
    }

    roam(coordinates, radius) {
        this.sprite.setState('move');

        let destination = randomPointInCircle(this.coordinates, radius);
        let a = angle(coordinates, destination);
        this.sprite.setDirectionFromAngle(a);

        const line = new LineString([ coordinates, destination ]);
        const length = line.getLength();
        const speed = this.params.game.speed.roaming;
        const position = this.sprite.getGeometryClone();
        this.sprite.hide();

        let lastTime = Date.now();
        let distance = 0;

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
                let coords = line.getCoordinateAt(distance / length);
                self.sprite.setCoordinates(coords);

                position.setCoordinates(coords);
                context.drawGeometry(position);
                self.basemap.map.render();
            }
            else {
                self.layer.un('postrender', animate);
                position.setCoordinates(destination);
                context.drawGeometry(position);

                self.sprite.setCoordinates(destination);
                self.sprite.display();
                
                self.sprite.setState('graze');

                setTimeout(() => {
                    self.roam(destination, radius);
                }, 4 * self.sprite.getFramerate());
            }
        }
    }
}

export default Target;