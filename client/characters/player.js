import { LineString } from "ol/geom.js";

import { angle, project, within } from "../cartography/analysis.js";
import { getVectorContext } from "ol/render.js";
import Rabbit from "./rabbit.js";
import { unByKey } from "ol/Observable.js";
import Router from "../cartography/routing.js";
import Flower from "./flower.js";
import { wait } from "../utils/dom.js";

class Player extends Rabbit {
    constructor(options) {
        super(options);
        this.level = options.level;

        // Routing infos
        this.router = new Router({ position: this.coordinates });

        this.destination = undefined;
        this.traveling = false;

        this.distance = 0;
        this.position = this.coordinates;

        this.closeEnemies = [];
        this.flowers = [];

        this.invulnerable = false;
    }

    // isInvulnerable() {
    //     return this.invulnerable;
    // }

    // makeInvulnerable(duration) {
    //     this.invulnerable = true;
    //     this.enableFrameSkipping();
    //     wait(duration, () => {
    //         this.disableFrameSkipping();
    //         this.invulnerable = false;
    //     });
    // }

    // stop() {
    //     // Remove the listener
    //     if (this.listener) { unByKey(this.listener); }

    //     if (this.flowers.length > 0) {
    //         this.flowers.shift().decay();
    //     }

    //     // Redraw the clone to avoid a missing frame
    //     this.context.setStyle(this.sprite.style);
    //     this.context.drawGeometry(this.clone);
    //     // Set the sprite coordinates to the destination
    //     this.sprite.setCoordinates(this.position);

    //     // Increment the traveled distance
    //     this.travelled += this.distance;

    //     // Set router position
    //     this.router.setPosition(this.clone.getCoordinates());

    //     this.sprite.resetGeometry();
    //     this.sprite.setState('idle');

    //     this.level.deactivateMovementButton();
    //     this.level.score.setState('default');

    //     this.traveling = false;
    // }

    // move(route, callback) {
    //     callback = callback || function () { };

    //     // Set routing button to moving mode
    //     this.level.moving();
    //     // Set the sprite to moving state
    //     this.setState('move');

    //     // Retrieve the vertexes composing the calculated route
    //     let vertexes = [];
    //     let nodes = route.geometry.coordinates;
    //     nodes.forEach((node) => { vertexes.push(project('4326', '3857', node)); });

    //     let flower = new Flower({
    //         basemap: this.basemap,
    //         level: this.level,
    //         coordinates: vertexes[vertexes.length - 1],
    //         zIndex: 35
    //     });
    //     this.flowers.push(flower);

    //     // Create the path line and calculate its length
    //     const line = new LineString(vertexes);
    //     const length = line.getLength();

    //     // Retrieve the time
    //     let lastTime = performance.now();

    //     // Get the speed in meters/second
    //     const speed = this.params.game.speed.travel / 3.6;

    //     // Start the distance counter
    //     this.distance = 0;

    //     const animation = (time) => {
    //         // Calculate the elapsed time in seconds
    //         const elapsed = (time - lastTime) / 1000;
    //         // Calculate the distance traveled depending on the elapsed time and the speed
    //         this.distance = this.distance + (elapsed * speed);
    //         // Set the previous time as the current one
    //         lastTime = time;

    //         // If the travelled distance is below the length of the route, continue the animation
    //         if (distance < length) {
    //             // Calculate the position of the point along the route line
    //             this.position = line.getCoordinateAt(this.distance / length);

    //             // Change the direction of the sprite according to its current movement
    //             let a = angle(this.getCoordinates(), this.position);
    //             this.setDirectionFromAngle(a);

    //             // Retrieve the helpers oustide and inside the visibible range
    //             let [inside, outside] = this.getWithin(this.layer.basemap.helpers.getActiveHelpers(), this.params.game.visibility.helpers);
    //             // Treating helpers outside the visible rande
    //             outside.forEach((helper) => {
    //                 // If they are visible, hide them
    //                 if (helper.isVisible()) { helper.hide(); }
    //             });
    //             // Treating helpers inside the visible range
    //             inside.forEach((helper) => {
    //                 // Reveal them if they are hidden
    //                 if (!helper.isVisible()) {
    //                     helper.reveal(() => { helper.breathe(); });
    //                 }
    //                 // Consume them if within consuming range
    //                 if (within(this.getCoordinates(), helper.getCoordinates(), this.params.game.tolerance.helpers)) {
    //                     helper.consume();
    //                     this.level.score.addModifier('helpers');
    //                 }
    //             });

    //             // Retrieve the enemies oustide and inside the visibible range
    //             [inside, outside] = this.getWithin(this.layer.basemap.enemies.getEnemies(), this.params.game.tolerance.enemies);
    //             // Treating enemies within range
    //             inside.forEach(enemy => {
    //                 // Check if the enemy has not already striked
    //                 if (!this.closeEnemies.includes(enemy)) {
    //                     this.closeEnemies.push(enemy);
    //                     if (!this.isInvulnerable()) {
    //                         this.level.score.addModifier('enemies');
    //                         this.makeInvulnerable(this.params.game.invulnerability);
    //                     }
    //                 }
    //             });
    //             // Treating enemies outside range
    //             outside.forEach(enemy => {
    //                 // If it was in close enemies
    //                 if (this.closeEnemies.includes(enemy)) {
    //                     // Remove it from the list
    //                     let i = this.closeEnemies.indexOf(enemy);
    //                     if (i > -1) { this.closeEnemies.splice(i, 1); }
    //                 }
    //             });

    //             this.setCoordinates(this.position);

    //             // If enemies are present, orient them towards the player
    //             if (this.layer.basemap.enemies) {
    //                 this.layer.basemap.enemies.setOrientation(this.position);
    //             }

    //             // If target is in range, win the level
    //             if (within(this.position, this.layer.basemap.target.getCoordinates(), this.params.game.tolerance.target)) {
    //                 this.stop();
    //                 callback(true);
    //             }
    //             requestAnimationFrame(animation);
    //         }
    //         else {
    //             this.setCoordinates(destination);
    //             callback();
    //         }
    //     };
    //     requestAnimationFrame(animation);

    //     // // This listener is executed at each layer rendering
    //     // this.listener = this.layer.on('postrender', (event) => {
    //     //     // Get the time of the current frame
    //     //     const time = event.frameState.time;
    //     //     this.context = getVectorContext(event);

    //     //     // Calculate the elapsed time in seconds
    //     //     const elapsed = (time - lastTime) / 1000;
    //     //     // Calculate the distance traveled depending on the elapsed time and the speed
    //     //     this.distance = this.distance + (elapsed * speed);
    //     //     // Set the previous time as the current one
    //     //     lastTime = time;

    //     //     // If the travelled distance is below the length of the route, continue the animation
    //     //     if (this.distance < length) {
    //     //         // Calculate the position of the point along the route line
    //     //         this.position = line.getCoordinateAt(this.distance / length);

    //     //         // Change the direction of the sprite according to its current movement
    //     //         let a = angle(this.clone.getCoordinates(), this.position);
    //     //         this.sprite.setDirectionFromAngle(a);

    //     //         // Update the sprite coordinates
    //     //         this.sprite.setCoordinates(this.position);

    //     //         // Retrieve the helpers oustide and inside the visibible range
    //     //         let [inside, outside] = this.getWithin(this.basemap.helpers.getActiveHelpers(), this.params.game.visibility.helpers);
    //     //         // Treating helpers outside the visible rande
    //     //         outside.forEach((helper) => {
    //     //             // If they are visible, hide them
    //     //             if (helper.isVisible()) { helper.hide(); }
    //     //         });
    //     //         // Treating helpers inside the visible range
    //     //         inside.forEach((helper) => {
    //     //             // Reveal them if they are hidden
    //     //             if (!helper.isVisible()) {
    //     //                 helper.reveal(() => { helper.breathe(); });
    //     //             }
    //     //             // Consume them if within consuming range
    //     //             if (within(this.getCoordinates(), helper.getCoordinates(), this.params.game.tolerance.helpers)) {
    //     //                 helper.consume();
    //     //                 this.level.score.addModifier('helpers');
    //     //             }
    //     //         });

    //     //         // Retrieve the enemies oustide and inside the visibible range
    //     //         [inside, outside] = this.getWithin(this.basemap.enemies.getEnemies(), this.params.game.tolerance.enemies);
    //     //         // Treating enemies within range
    //     //         inside.forEach(enemy => {
    //     //             // Check if the enemy has not already striked
    //     //             if (!this.closeEnemies.includes(enemy)) {
    //     //                 this.closeEnemies.push(enemy);
    //     //                 if (!this.isInvulnerable()) {
    //     //                     this.level.score.addModifier('enemies');
    //     //                     this.makeInvulnerable(this.params.game.invulnerability);
    //     //                 }
    //     //             }
    //     //         });
    //     //         // Treating enemies outside range
    //     //         outside.forEach(enemy => {
    //     //             // If it was in close enemies
    //     //             if (this.closeEnemies.includes(enemy)) {
    //     //                 // Remove it from the list
    //     //                 let i = this.closeEnemies.indexOf(enemy);
    //     //                 if (i > -1) { this.closeEnemies.splice(i, 1); }
    //     //             }
    //     //         });

    //     //         // Set the new coordinates to the clone
    //     //         this.clone.setCoordinates(this.position);
    //     //         // Apply the style to the clone for orientation
    //     //         this.context.setStyle(this.sprite.style);
    //     //         // Redraw the clone
    //     //         this.context.drawGeometry(this.clone);

    //     //         // If enemies are present, orient them towards the player
    //     //         if (this.basemap.enemies) {
    //     //             this.basemap.enemies.setOrientation(this.position);
    //     //         }

    //     //         // If target is in range, win the level
    //     //         if (within(this.position, this.basemap.target.getCoordinates(), this.params.game.tolerance.target)) {
    //     //             this.stop();
    //     //             callback(true);
    //     //         }

    //     //         // Render the map to trigger the listener
    //     //         this.basemap.map.render();
    //     //     }
    //     //     // Here, destination reached
    //     //     else {
    //     //         // Stop the animation
    //     //         this.stop();
    //     //         callback(false);
    //     //     }
    //     // });
    // }

    // travel(destination, callback) {
    //     callback = callback || function () { };

    //     if (this.traveling) { this.stop(); }
    //     this.traveling = true;
    //     this.destination = destination;

    //     // Show the routing button and set it to routing mode
    //     this.level.activateMovementButton();
    //     this.level.routing();

    //     // Calculate the route using the router (AJAX)
    //     this.router.calculateRoute(destination, (route) => {
    //         // Make sure the map hasn't been clicked while fetching the route
    //         if (destination === this.destination) {
    //             // Change the score increment
    //             this.level.score.setState('movement');
    //             this.move(route, callback);
    //         }
    //     });
    // }
}

export default Player;