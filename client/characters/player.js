import { LineString } from "ol/geom.js";

import { angle, project, within } from "../cartography/analysis.js";
import { getVectorContext } from "ol/render.js";
import Rabbit from "./rabbit.js";

class Player extends Rabbit {
    constructor(options) {
        super(options);
        this.level = options.level;
    }

    travel(route, callback) {
        callback = callback || function () {};

        let increment = this.params.game.score.increment.movement;
        let interval = this.params.game.score.refresh.movement;
        this.level.score.change(increment, interval);

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
        const speed = this.params.game.speed.travel / 3.6;
        const position = this.sprite.getGeometryClone();

        this.sprite.hide();
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
                let coords = line.getCoordinateAt(distance / length);

                let a = angle(position.getCoordinates(), coords);
                self.sprite.setDirectionFromAngle(a);
                self.sprite.setCoordinates(coords);

                let [inside, outside] = self.getWithin(self.basemap.helpers.getActiveHelpers(), self.params.game.visibility.helpers);
                
                outside.forEach((helper) => {
                    if (helper.isVisible()) { helper.hide(); }
                });

                inside.forEach((helper) => {
                    if (!helper.isVisible()) {
                        helper.reveal(() => { helper.breathe(); });
                    }
                    if (within(self.getCoordinates(), helper.getCoordinates(), self.params.game.tolerance.helpers)) {
                        helper.consume();
                    }
                });

                // self.pitfallsHandling(coords);
                // self.bonusHandling(coords);

                let win = false;
                
                // if (within(coords, self.options.target, self.params.game.tolerance.target)) { win = true; }

                // if (path === undefined) { path = new LineString([ vertexes[0], coords ]); }
                // else { path.appendCoordinate(coords); }

                // // context.setStyle(self.layers.getStyle(['path']));
                // context.drawGeometry(path);

                position.setCoordinates(coords);
                context.setStyle(self.sprite.style);
                context.drawGeometry(position);

                // Render the map to trigger the listener
                self.basemap.map.render();

                if (self.basemap.enemies) {
                    self.basemap.enemies.setOrientation(coords);
                }

                if (win) { stopAnimation(context, true); }
            }
            // Here, the journey is over
            else { stopAnimation(context, false); }
        }

        function stopAnimation(context, end) {
            context.setStyle(self.sprite.style);
            context.drawGeometry(position);
            self.sprite.setCoordinates(destination);
            self.sprite.display();
            self.sprite.setState('idle');

            // Removing the render listener
            self.layer.un('postrender', animatePlayer);

            let score = self.params.game.score;
            self.level.score.change(score.increment.default, score.refresh.default);
            self.travelled += distance;

            callback(destination, end);
        }
    
    }
}

export default Player;