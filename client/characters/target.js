import { Feature } from "ol";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { Fill, Style } from "ol/style";
import { getVectorContext } from "ol/render";
import { LineString } from "ol/geom";

import Character from "./character.js";
import { DynamicSprite } from "../cartography/sprite.js";
import { getColorsByClassNames } from "../utils/parse.js";
import { angle, buffer, randomPointInCircle } from "../cartography/analysis.js";

class Target extends Character {
    constructor(options) {
        super(options);
        this.sprite = new DynamicSprite({
            layer: this.layer,
            src: './assets/sprites/rabbit-brown.png',
            width: 35,
            height: 35,
            scale: 1,
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
        
        let sizeArea = this.basemap.params.game.tolerance.target;

        // this.area = new VectorLayer({
        //     source: new VectorSource({
        //         features: [
        //             new Feature({ geometry: buffer(this.coordinates, sizeArea) })
        //         ],
        //     }),
        //     style: new Style({
        //         fill: new Fill({
        //             color: getColorsByClassNames('bonus-transparent')['bonus-transparent']
        //         })
        //     }),
        //     zIndex: this.zindex - 1,
        //     updateWhileAnimating: true,
        //     updateWhileInteracting: true,
        //     opacity: 0,
        // });

        // this.basemap.map.addLayer(this.area);
        // this.basemap.layers.push(this.area);

        this.roam(this.coordinates, sizeArea);
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
        this.sprite.setDirection(a);

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
                
                self.sprite.setState('graze');

                setTimeout(() => {
                    self.roam(destination, radius);
                }, 4 * self.sprite.getFramerate());
            }
        }
    }
}

export default Target;