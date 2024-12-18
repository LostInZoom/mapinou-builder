import * as turf from "@turf/turf";
import { Polygon } from "ol/geom";
import { project } from "./map";

/**
 * Calculate a buffer around the given coordinates.
 * @param {array} coordinates The coordinates of the point.
 * @param {integer} size      The size of the buffer in meters.
 * @return {Polygon}          OpenLayers Polygon geometry.
 */
function buffer(coordinates, size) {
    // Project provided coordinates
    let c = project('3857', '4326', coordinates)

    // Calculate the buffer around the coordinates
    let b = turf.buffer(turf.point(c), size, { units: "meters", steps: 16 })

    // Project the resulting coordinates
    let v = []
    for (let i = 0; i < b.geometry.coordinates[0].length; i++) { v.push(project('4326', '3857',  b.geometry.coordinates[0][i])); }

    // Return an openlayer polygon from the list of vertexes
    return new Polygon([v]);
}

export { buffer }