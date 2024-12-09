/**
 * @routing
 * Classes and functions related to the routing fonctionalities within the game.
 */

import { ajaxGet } from "./utils/ajax";

class Router {
    constructor(map) {
        this.map = map;
        this.current = map.view.getCenter();
    }

    calculateRoute(target) {
        let url = 'https://data.geopf.fr/navigation/itineraire?'
            + 'resource=bdtopo-osrm'
            + '&profile=pedestrian'
            + '&optimization=shortest'
            + '&start='+start[0]+','+start[1]
            + '&end='+end[0]+','+end[1]
            + '&geometryFormat=geojson'

        ajaxGet(url, (route) => {

        });
    }
}

export default Router