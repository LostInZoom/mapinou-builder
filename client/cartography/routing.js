/**
 * @routing
 * Classes and functions related to the routing fonctionalities within the game.
 */

import { ajaxGet } from "../utils/ajax.js";
import { project } from "./analysis.js";

class Router {
    constructor(options) {
        this.position = options.position;
    }

    setPosition(position) {
        this.position = position;
    }

    calculateRoute(target, callback) {
        callback = callback || function() {};
        const origin = project('3857', '4326', this.position);
        const destination = project('3857', '4326', target);
        let url = 'https://data.geopf.fr/navigation/itineraire?'
            + 'resource=bdtopo-osrm'
            + '&profile=pedestrian'
            + '&optimization=shortest'
            + '&start='+origin[0]+','+origin[1]
            + '&end='+destination[0]+','+destination[1]
            + '&geometryFormat=geojson'

        ajaxGet(url, (route) => {
            callback(route);
        });
    }
}

export default Router