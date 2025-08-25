/**
 * @routing
 * Classes and functions related to the routing fonctionalities within the game.
 */

import { ajaxGet } from "../utils/ajax.js";

class Router {
    constructor(options) {
        this.position = options.position;
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
}

export default Router