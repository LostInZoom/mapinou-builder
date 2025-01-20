import * as turf from "@turf/turf";
import { Polygon } from "ol/geom.js";
import { project } from "./map.js";

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

/**
 * Return the coordinates of the middle point between the two provided positions.
 * @param {array} position1 Coordinates of first position.
 * @param {array} position2 Coordinates of second position.
 * @return {array}          Coordinates of the middle position.
 */
function middle(position1, position2) {
    let x1, y1, x2, y2;
    [ x1, y1 ] = position1;
    [ x2, y2 ] = position2;
    return [ (x1 + x2) / 2, (y1 + y2) / 2 ];
}

/**
 * Return true if position1 and position2 are within a given distance in meters.
 * @param {array} position1 Coordinates of first position.
 * @param {array} position2 Coordinates of second position.
 * @param {number} distance Distance in meters.
 * @return {boolean}        true if both position are within a given distance from each other.
 */
function within(position1, position2, distance) {
    let c1 = project('3857', '4326', position1);
    let c2 = project('3857', '4326', position2);
    let d = turf.distance(turf.point(c1), turf.point(c2), { units: "meters" });
    
    if (d > distance) { return false; }
    else { return true; }
}

export { buffer, middle, within }