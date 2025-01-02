import { unByKey } from "ol/Observable";
import { LineString } from "ol/geom";

import Basemap from "./cartography/map";
import Router from "./cartography/routing";
import { project } from "./cartography/map";
import { makeDiv, addSVG, addClass, removeClass, hasClass } from "./utils/dom";
import { getVectorContext } from "ol/render";
import { middle, within } from "./cartography/analysis";
import { center } from "@turf/turf";

/**
 * Create a new game.
 */
class Game {
    constructor(app) {
        this.app = app;
        this.position = [ 270845.15, 5904541.30 ];
        this.player = [ 396377.1, 5701254.9 ];
        this.target = [ 416553.587, 5708562.378 ];
        // The tolerance in meters allowed to find the point in phase 1
        this.findTolerance = 500;
        // The tolerance in meters to validate the target
        this.targetTolerance = 20;
        // The tolerance in meters allowed around the pitfalls
        this.pitfallTolerance = 500;
        
        // The speed in km/h of the movement on the map
        this.speed = 5000;
        this.pitfalls = [
            [ 399537.1, 5699198.9 ],
            [ 399416.53, 5703120.31 ],
            [ 402172.7, 5700144.5 ],
            [ 404291.06, 5700146.56 ],
            [ 407776.7, 5703492.8 ],
            [ 411222.6, 5703538.6 ],
            [ 415029.6, 5707542.2 ],
            [ 402876.1, 5707401.3 ],
            [ 404785.3, 5711359.4 ],
            [ 405730.7, 5706364.3 ],
            [ 411794.4, 5707942.2 ],
            [ 409265.0, 5709098.6 ],
        ]

        this.zoom = 5;
        this.zoomMovement = 14;
        this.mode;
        if (this.zoom >= this.zoomMovement) { this.mode = 'routing'; }
        else { this.mode = 'navigation'; }

        this.basemap = new Basemap(this.app);
        this.basemap.setCenter(this.position);
        this.basemap.setZoom(this.zoom);

        // DEBUG
        this.basemap.setCenter(this.player);
        this.basemap.setZoom(15);

        this.router = new Router(this.basemap, this.player);

        // Create the loading screen
        this.loader = makeDiv('loading-container');
        // Create the home button to return to the main menu
        this.homebutton = makeDiv('button-home', 'button-game button');
        addSVG(this.homebutton, './src/img/home.svg');
        // Return to the main menu by translating the whole ui
        this.homebutton.addEventListener('click', (e) => {
            this.app.container.style.transform = 'translateX(0%)'
        });

        this.modebutton = makeDiv('mode-indicator', 'button-game');
        if (this.zoom < this.zoomMovement) { addSVG(this.modebutton, './src/img/compass.svg'); }
        else { addSVG(this.modebutton, './src/img/routing.svg'); }

        this.basemap.map.on('moveend', (e) => {
            let zoom = this.basemap.view.getZoom();
            if (zoom >= this.zoomMovement && this.mode === 'navigation') {
                this.modebutton.innerHTML = '';
                addSVG(this.modebutton, './src/img/routing.svg');
                this.mode = 'routing';
            }
            else if (zoom < this.zoomMovement && this.mode === 'routing') {
                this.modebutton.innerHTML = '';
                addSVG(this.modebutton, './src/img/compass.svg');
                this.mode = 'navigation';
            }
        });

        this.hint = ''
        this.objective = ''
        this.hintcontainer = makeDiv('hint-container', 'active');
        this.hintbutton = makeDiv('hint-button');
        this.hintcontent = makeDiv('hint-content');
        this.hinttext = makeDiv('hint-text');
        this.hintcontent.append(this.hinttext);
        this.hintcontainer.append(this.hintbutton, this.hintcontent);

        this.hintbutton.addEventListener('click', (e) => {
            if (hasClass(this.hintcontainer, 'active')) { removeClass(this.hintcontainer, 'active'); }
            else { addClass(this.hintcontainer, 'active'); }
        });
        
        this.app.gamenode.append(this.loader, this.homebutton, this.modebutton, this.hintcontainer);

        // Wait fot the translating animation to add the continue button on the main menu
        setTimeout(() => {
            this.app.addContinueButton();
        }, 300);

        this.phase1(this);
    }

    /**
     * Activates the phase 1 of the game:
     * The player must find its position on the map given a textual description
     */
    phase1(game) {
        this.hint = `
            You are in a hamlet called La Colombière.<br><br>
            It is located in the west of Lyon, between Saint-Etienne and Clermond-Ferrand in the Parc Naturel Régional du Livradois-Forez.<br><br>
            The hamlet is in the west of the town of Ambert, between St-Amant-Roche-Savine and St-Germain-l'Herm.<br><br>
            It is southwest of Fournols, near the waterbodies of Étangs de la Colombière.<br><br>
            Double click on your position to continue.
        `
        this.hinttext.innerHTML = this.hint;
        this.objective = 'Find your position'
        this.hintbutton.innerHTML = this.objective;

        let finder = game.basemap.map.on('dblclick', (e) => {
            // Remove the listener while the animation is playing
            unByKey(finder);

            let target = game.basemap.map.getEventCoordinate(event);
            if (within(target, game.player, game.findTolerance)) {
                game.phase2(game);
            } else {
                game.phase1(game);
            }
        });
    }

    /**
     * Activates the phase 2 of the game:
     * The player must travel to the destination while avoiding pitfalls to win.
     */
    phase2(game) {
        // Place the player on the map
        game.basemap.setPlayer(game.player);
        game.basemap.setTarget(game.target);
        game.activateMovement(game);
        game.activatePitfalls(game);

        game.basemap.view.animate({
            // Set the new center as the middle point between the player and the target
            center: middle(game.player, game.target),
            zoom: game.basemap.getZoomForData(),
        }, () => {
            // game.basemap.map.render();
            
            this.hint = `
                Congratulations, you found yourself on the map!<br><br>
                Now, travel to your destination as fast as possible and avoid the pitfalls on the way,
                crossing their area of influence will make you lose.<br><br>
                You can only move at higher zoom level, so you need to navigate the map to get closer to your
                destination while avoiding pitfalls on the way. The indicator in the top right corner indicates
                if you can move or not.
            `
            this.hinttext.innerHTML = this.hint;
            this.objective = 'Travel to your destination'
            this.hintbutton.innerHTML = this.objective;
            if (!hasClass(this.hintcontainer, 'active')) { addClass(this.hintcontainer, 'active'); }
        });
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
    activateMovement(game) {
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
                    const speed = game.speed / 3.6;
                    const position = basemap.player.getGeometry().clone();

                    let path = game.basemap.path.getGeometry();
                    if (path !== undefined) { path = path.clone(); }

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

                            let isWithin = false;
                            for (let i = 0; i < game.pitfalls.length; i++) {
                                if (within(newPosition, game.pitfalls[i], this.pitfallTolerance)) {
                                    isWithin = true;
                                }
                            }
                        
                            if (path === undefined) { path = new LineString([ vertexes[0], newPosition ]); }
                            else { path.appendCoordinate(newPosition); }

                            context.setStyle(basemap.styles['path']);
                            context.drawGeometry(path);

                            position.setCoordinates(newPosition);
                            context.setStyle(basemap.styles['player']);
                            context.drawGeometry(position);

                            // Render the map to trigger the listener
                            basemap.map.render();
                        }
                        // Here, the journey is over
                        else {
                            // Redraw on context to avoid flickering
                            context.setStyle(basemap.styles['path']);
                            context.drawGeometry(path);
                            context.setStyle(basemap.styles['player']);
                            context.drawGeometry(position);

                            // Removing the render listener
                            basemap.player.setGeometry(position);
                            basemap.path.setGeometry(path);

                            // game.basemap.setPath(finalVertexes);
                            router.setPosition(destination);

                            // Removing the render listener
                            basemap.pathLayer.un('postrender', animatePlayer);

                            // Reactivate movement on the map
                            game.activateMovement(game);
                            console.log('end');
                        }
                    }

                    basemap.player.setGeometry(null);
                    basemap.path.setGeometry(null);
                    basemap.pathLayer.on('postrender', animatePlayer);
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