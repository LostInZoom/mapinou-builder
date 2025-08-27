/**
 * @routing
 * Classes and functions related to the routing fonctionalities within the game.
 */

import Journeys from "../layers/journeys.js";
import { ajaxGet } from "../utils/ajax.js";

class Router {
    constructor(options) {
        this.options = options || {};
        this.basemap = this.options.basemap;
        this.player = this.options.player;
        this.params = this.basemap.options.app.options;

        this.position = this.options.position;
        this.journeys = new Journeys({
            id: 'level-journeys',
            basemap: this.basemap,
            behind: 'level-enemies',
            color: this.player.getColor(),
            maxlength: 3000
        });
    }

    setPosition(position) {
        this.position = position;
    }

    calculateRoute(target, callback) {
        callback = callback || function () { };
        let url = 'https://data.geopf.fr/navigation/itineraire?'
            + 'resource=bdtopo-osrm'
            + '&profile=pedestrian'
            + '&optimization=shortest'
            + `&start=${this.position[0]},${this.position[1]}`
            + `&end=${target[0]},${target[1]}`
            + '&geometryFormat=geojson'

        ajaxGet(url, (route) => {
            callback(route);
        });
    }

    stopFadeJourney() {
        this.journeys.stopFade();
    }

    fadeJourney() {
        this.journeys.fade();
    }

    updateJourney(coordinates) {
        this.journeys.update(coordinates);
    }
}

export default Router