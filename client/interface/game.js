import { unByKey } from "ol/Observable.js";
import { LineString } from "ol/geom.js";
import { getVectorContext } from "ol/render.js";

import Basemap from "../cartography/map.js";
import Router from "../cartography/routing.js";
import { project } from "../cartography/map.js";
import { makeDiv, addSVG, addClass, removeClass, hasClass, activate, wait } from "../utils/dom.js";
import { middle, within } from "../cartography/analysis.js";

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
        this.targetTolerance = 50;
        // The tolerance in meters allowed around the pitfalls
        this.pitfallTolerance = 500;

        // The score of the player
        this.score = 0;
        this.pitfallPenalty = 100;
        
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
        // Flag to track if player is currently inside a pitfall area
        this.pitfall = false;

        this.zoom = 5;
        this.zoomMovement = 14;
        this.mode;
        if (this.zoom >= this.zoomMovement) { this.mode = 'routing'; }
        else { this.mode = 'navigation'; }

        this.basemap = new Basemap(this.app);
        this.basemap.setCenter(this.position);
        this.basemap.setZoom(this.zoom);

        // DEBUG
        // this.basemap.setCenter(this.player);
        // this.basemap.setZoom(15);

        this.router = new Router(this.basemap, this.player);

        // Create the loading screen
        this.loader = makeDiv('loading-container');
        // Create the home button to return to the main menu
        this.homebutton = makeDiv('button-home', 'button-game button');
        addSVG(this.homebutton, new URL('../img/home.svg', import.meta.url));
        // Return to the main menu by translating the whole ui
        this.homebutton.addEventListener('click', (e) => {
            this.app.container.style.transform = 'translateX(0%)'
        });

        this.modebutton = makeDiv('mode-indicator', 'button-game');
        if (this.zoom < this.zoomMovement) { addSVG(this.modebutton, new URL('../img/compass.svg', import.meta.url)); }
        else { addSVG(this.modebutton, new URL('../img/routing.svg', import.meta.url)); }

        this.basemap.map.on('moveend', (e) => {
            let zoom = this.basemap.view.getZoom();
            if (zoom >= this.zoomMovement && this.mode === 'navigation') {
                this.modebutton.innerHTML = '';
                addSVG(this.modebutton, new URL('../img/routing.svg', import.meta.url));
                this.mode = 'routing';
            }
            else if (zoom < this.zoomMovement && this.mode === 'routing') {
                this.modebutton.innerHTML = '';
                addSVG(this.modebutton, new URL('../img/compass.svg', import.meta.url));
                this.mode = 'navigation';
            }
        });

        this.hint = ''
        this.objective = ''
        this.hintcontainer = makeDiv('hint-container');
        this.hintbutton = makeDiv('hint-button');
        this.hintcontent = makeDiv('hint-content');
        this.hinttext = makeDiv('hint-text');
        this.hintcontent.append(this.hinttext);
        this.hintcontainer.append(this.hintbutton, this.hintcontent);

        this.hintbutton.addEventListener('click', (e) => {
            this.openHint();
        });

        this.scoretext = makeDiv('score-text', 'button-game', this.score);
        this.score = new Score(0, 1, 1000, this.scoretext);
        
        this.app.gamenode.append(this.loader, this.homebutton, this.scoretext, this.modebutton, this.hintcontainer);

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
        this.openHint();

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
        game.activatePitfalls(game);
        game.activateMovement(game);

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
            this.openHint();
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
     * This method opens the hint window.
     */
    openHint() {
        if (hasClass(this.hintcontainer, 'active')) {
            removeClass(this.hintcontainer, 'active');
            this.score.start();
            this.basemap.activate();
        }
        else {
            addClass(this.hintcontainer, 'active');
            this.score.stop();
            this.basemap.deactivate();
        }
    }

    /**
     * This method increments the score with a multiplier.
     */
    incrementScore(value, interval, pursue) {
        if (this.scoreInterval !== undefined) { clearInterval(this.scoreInterval); }
        if (pursue) {
            this.scoreInterval = setInterval(() => {
                if (this.scoreActive) {
                    this.score += value;
                    this.scoretext.innerHTML = this.score;
                }
            }, interval); 
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
                    console.log('routing...');
                    game.score.change(1, 200);
                    
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
                        function stopAnimation(context, end) {
                            // Redraw on context to avoid flickering
                            context.setStyle(basemap.styles['path']);
                            context.drawGeometry(path);
                            context.setStyle(basemap.styles['player']);
                            context.drawGeometry(position);

                            basemap.player.setGeometry(position);
                            basemap.path.setGeometry(path);

                            router.setPosition(destination);

                            // Removing the render listener
                            basemap.pathLayer.un('postrender', animatePlayer);
                            game.score.change(1, 1000);
                            console.log('end');

                            if (end) {
                                game.over();
                            }
                            else {
                                game.activateMovement(game);
                            }
                        }

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

                            let pit = false;
                            for (let i = 0; i < game.pitfalls.length; i++) {
                                // Check if current position if within a pitfall area
                                if (within(newPosition, game.pitfalls[i], game.pitfallTolerance)) { pit = true; break; }
                            }
                            // If current position is within a pitfall area
                            if (pit) {
                                // If player is not already inside a pitfall area
                                if (!game.pitfall) {
                                    // Increment the score by 100 and set player as within pitfall area
                                    game.score.add(game.pitfallPenalty);
                                    game.pitfall = true
                                }
                            }
                            // Here current position is not within a pitfall area
                            else {
                                // If the player was previously in a pitfall area, set the player as outside pitfall
                                if (game.pitfall) { game.pitfall = false; }
                            }

                            let win = false;
                            if (within(newPosition, game.target, game.targetTolerance)) { win = true; }

                            if (path === undefined) { path = new LineString([ vertexes[0], newPosition ]); }
                            else { path.appendCoordinate(newPosition); }

                            context.setStyle(basemap.styles['path']);
                            context.drawGeometry(path);

                            position.setCoordinates(newPosition);
                            context.setStyle(basemap.styles['player']);
                            context.drawGeometry(position);

                            // Render the map to trigger the listener
                            basemap.map.render();

                            if (win) {
                                stopAnimation(context, true);
                            }
                        }
                        // Here, the journey is over
                        else { stopAnimation(context, false); }
                    }

                    basemap.player.setGeometry(null);
                    basemap.path.setGeometry(null);
                    basemap.pathLayer.on('postrender', animatePlayer);
                });
            }
        });
    }

    /**
     * This method ends the current game.
     */
    over() {
        let game = this;
        game.score.stop();
        let text = 'Congratulation, you reached the target!<br>Your score: ' + game.score;

        // Create the loading screen
        let mask = makeDiv(null, 'mask');
        let container = makeDiv(null, 'window-container');
        let content = makeDiv(null, 'content-over', text);
        let button = makeDiv(null, 'button button-over', 'Menu');

        container.append(content, button);
        mask.append(container);
        game.app.gamenode.append(mask);

        wait(10, () => {
            activate(container);
            let returnMenu = button.addEventListener('click', (e) => {
                button.removeEventListener('click', returnMenu);
                game.app.removeContinueButton();
                game.app.container.style.transform = 'translateX(0%)'
                wait(300, () => {
                    game.destroy();
                });
            });
        });
    }

    destroy() {
        this.app.gamenode.remove();
        this.app.game = undefined;
        this.app.gamenode = makeDiv('game', 'menu-container');
        this.app.container.append(this.app.gamenode);
    }
}

class Score {
    constructor(value, increment, interval, html) {
        this.value = value;
        this.increment = increment;
        this.interval = interval;
        this.html = html;
        this.object;
    }

    add(value) {
        this.value += value;
    }

    start() {
        this.stop();
        this.object = setInterval(() => {
            this.value += this.increment;
            this.html.innerHTML = this.value;
        }, this.interval);
    }

    stop() {
        if (this.object !== undefined) { clearInterval(this.object); }
    }

    change(increment, interval) {
        this.stop();
        this.increment = increment;
        this.interval = interval;
        this.start();
    }
}

export default Game;