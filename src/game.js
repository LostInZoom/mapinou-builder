import { unByKey } from "ol/Observable";
import { LineString } from "ol/geom";

import Basemap from "./cartography/map";
import Router from "./cartography/routing";
import { project } from "./cartography/map";
import { makeDiv, addSVG, clearElement } from "./utils/dom";

/**
 * Create a new game.
 */
class Game {
    constructor(app) {
        this.app = app;
        this.position = [ 270845.15, 5904541.30 ];
        this.player = [ 396377.1, 5701254.9 ];
        this.target = [ 416553.587, 5708562.378 ];
        this.pitfalls = [
            [ 399537.1, 5699198.9 ],
            [ 399416.53, 5703120.31 ],
            [ 402172.7, 5700144.5 ],
            [ 404291.06, 5700146.56 ],
            [ 407776.7, 5703492.8 ],
            [ 411222.6, 5703538.6 ],
            [ 415029.6, 5707542.2 ],
        ]

        this.zoom = 5;
        this.zoomMovement = 14;

        this.basemap = new Basemap(this.app);
        this.basemap.setCenter(this.position);
        this.basemap.setZoom(this.zoom);

        // Place the player on the map
        this.basemap.setPlayer(this.player);
        this.basemap.setTarget(this.target);

        // The speed in km/h of the movement on the map
        this.speed = 5000;

        this.router = new Router(this.basemap, this.player);
        this.allowMovement(this);
        this.activatePitfalls(this);

        // Create the loading screen
        this.loader = makeDiv('loading-container');
        // Create the home button to return to the main menu
        this.homebutton = makeDiv('button-home', 'button-game button');
        addSVG(this.homebutton, './src/img/home.svg');
        // Return to the main menu by translating the whole ui
        this.homebutton.addEventListener('click', (e) => {
            this.app.container.style.transform = 'translateX(0%)'
        });
        this.app.gamenode.append(this.loader, this.homebutton);

        // Wait fot the translating animation to add the continue button on the main menu
        setTimeout(() => {
            this.app.addContinueButton();
        }, 300)
    }

    /**
     * This method activates the pitfalls.
     * i.e. the obstacles the player must avoid to complete the game.
     */
    activatePitfalls(game) {
        for (let i = 0; i < game.pitfalls.length; i++) {
            game.basemap.addPitfall(game.pitfalls[i]);
        }
    }

    /**
     * This method activate a listener on the map click that allows
     * the player to move.
     */
    allowMovement(game) {
        let movement = game.basemap.map.on('click', (e) => {
            // Allow movement only if the zoom level is high enough
            if (game.basemap.view.getZoom() >= game.zoomMovement) {
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
            }
        });
    }

    destroy() {
        this.app.gamenode.remove();
        this.app.game = undefined;
        this.app.gamenode = makeDiv('game', 'menu-container');
        this.app.container.append(this.app.gamenode);
    }
}

export default Game;