import { unByKey } from "ol/Observable";
import { LineString } from "ol/geom";

import Basemap from "./cartography/map";
import Router from "./cartography/routing";
import { project } from "./cartography/map";

class Game {
    constructor(app) {
        let position = [ 406214.54,5784408.44 ];
        let zoom = 16;

        this.basemap = new Basemap(app);
        this.basemap.setCenter(position);
        this.basemap.setZoom(zoom);

        // Place the player on the map
        this.basemap.setPlayer(position);

        // The speed in km/h of the movement on the map
        this.speed = 1000;

        this.router = new Router(this.basemap, position);
        this.allowMovement(this);

    }

    allowMovement(game) {
        let movement = game.basemap.map.on('click', (e) => {
            // Remove the listener while the animation is playing
            unByKey(movement);
            // Get the destination position
            let target = game.basemap.map.getEventCoordinate(event);
            console.log('start');

            // Calculate the route towards the destination
            game.router.calculateRoute(target, (result) => {
                console.log('routing...')
                const basemap = game.basemap;
                const router = game.router;

                let pathGeometry = game.basemap.path.getGeometry();
                let first = false;
                if (pathGeometry === undefined) { first = true; }

                // Retrieve the vertexes composing the calculated route
                const vertexes = [];
                const nodes = result.geometry.coordinates;
                for (let i = 0; i < nodes.length; i++) {
                    vertexes.push(project('4326', '3857', nodes[i]));
                }

                let destination = vertexes[vertexes.length - 1]
                let growingVertexes, finalVertexes;
                if (first) {
                    growingVertexes = [ vertexes[0] ];
                    finalVertexes = vertexes;
                } else {
                    growingVertexes = pathGeometry.getCoordinates();
                    growingVertexes.pop();
                    finalVertexes = growingVertexes.concat(vertexes);
                }

                // Create the path line and calculate its length
                const line = new LineString(vertexes);
                const length = line.getLength();

                let lastTime = Date.now();
                let distance = 0;

                // Get the speed in meters/second
                const speed = game.speed / 3.6;              

                function animatePlayer(event) {
                    // Get the current time
                    const time = event.frameState.time;
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
                        // Add the position to the growing vertexes and redraw the path
                        growingVertexes.push(newPosition);
                        game.basemap.setPath(growingVertexes);
                        // Update the player position
                        basemap.setPlayer(newPosition);
                        // Render the map to trigger the listener
                        basemap.map.render();
                    }
                    // Here, the journey is over
                    else {
                        // Removing the render listener
                        basemap.pathLayer.un('postrender', animatePlayer);
                        game.basemap.setPath(finalVertexes);
                        router.setPosition(destination);
                        basemap.setPlayer(destination);
                        // Reactivate movement on the map
                        game.allowMovement(game);
                        console.log('end');
                    }
                }

                basemap.pathLayer.on('postrender', animatePlayer);
                basemap.map.render();
            });
        });
    }
}

export default Game;