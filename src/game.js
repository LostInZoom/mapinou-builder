import { unByKey } from "ol/Observable";
import { Feature } from "ol";
import { LineString } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import Basemap from "./cartography/map"
import Router from "./cartography/routing"
import { project } from "./cartography/map";

class Game {
    constructor(app) {
        let position = [ 406214.54,5784408.44 ];
        let zoom = 16;

        this.basemap = new Basemap(app);
        this.basemap.setCenter(position);
        this.basemap.setZoom(zoom);
        this.basemap.setPlayer(position);
        this.movement = false;

        this.router = new Router(this.basemap, position);
        this.activateMovement(this.basemap);
    }

    activateMovement(basemap) {
        let movement = this.basemap.map.on('click', (e) => {
            // Remove the listener while the animation is playing
            unByKey(movement);
            // Get the target
            let target = this.basemap.map.getEventCoordinate(event);

            // Calculate the route towards the target
            this.router.calculateRoute(target, (result) => {
                // Retrieve the vertexes composing the calculated route
                const vertexes = [];
                const nodes = result.geometry.coordinates;
                for (let i = 0; i < nodes.length; i++) {
                    vertexes.push(project('4326', '3857', nodes[i]));
                }
                // Create the LineString object
                const line = new LineString(vertexes);
                
                // Create the feature
                const lineFeature = new Feature({
                    type: 'route',
                    geometry: line,
                });
                // Create the layer
                const layer = new VectorLayer({
                    source: new VectorSource({
                        features: [ lineFeature ],
                    }),
                    style: this.basemap.styles['route'],
                    zIndex: 10,
                });

                // Add the layer to the map
                this.basemap.map.addLayer(layer);

                // Set the geometry of the player to null while the animation is playing
                this.basemap.player.setGeometry(null);

                // let distance = 0;
                // let animating = false;
                // let lastTime;

                // function moveFeature(event) {
                //     const speed = 60;
                //     const time = event.frameState.time;
                //     const elapsedTime = time - lastTime;
                //     distance = (distance + (speed * elapsedTime) / 1e6) % 2;
                //     lastTime = time;
                
                //     const currentCoordinate = route.getCoordinateAt(
                //         distance > 1 ? 2 - distance : distance,
                //     );
                //     position.setCoordinates(currentCoordinate);
                //     const vectorContext = getVectorContext(event);
                //     vectorContext.setStyle(styles.geoMarker);
                //     vectorContext.drawGeometry(position);
                //     // tell OpenLayers to continue the postrender animation
                //     map.render();
                //   }

                this.basemap.setCenter(target);
                this.router.setPosition(target);
                this.basemap.updatePlayer(vertexes[vertexes.length - 1]);

                // Reactivate movement
                this.activateMovement(this.basemap);
            });
        });
    }
}

export default Game;