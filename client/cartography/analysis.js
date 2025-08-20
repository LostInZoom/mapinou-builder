import * as turf from "@turf/turf";
import { Polygon } from "ol/geom.js";

import { LngLat } from "maplibre-gl";
import proj4 from "proj4";

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
    let b = turf.buffer(turf.point(c), size, { units: "meters", steps: 12 })

    // Project the resulting coordinates
    let v = []
    for (let i = 0; i < b.geometry.coordinates[0].length; i++) { v.push(project('4326', '3857', b.geometry.coordinates[0][i])); }

    // Return an openlayer polygon from the list of vertexes
    return new Polygon([v]);
}

/**
 * Calculate a buffer around the given polygon.
 * @param {array} coordinates The coordinates of the point.
 * @param {integer} size      The size of the buffer in meters.
 * @return {Polygon}          OpenLayers Polygon geometry.
 */
function bufferAroundPolygon(coordinates, size) {
    let projected = [];
    coordinates.forEach(c => { projected.push(project('3857', '4326', c)) });

    // Calculate the buffer around the coordinates
    let polygon = turf.polygon([projected]);
    let b = turf.buffer(polygon, size, { units: "meters", steps: 4 });
    let d = turf.difference(turf.featureCollection([b, polygon]));

    // Project the resulting coordinates
    let v = []
    d.geometry.coordinates.forEach(linear => {
        let l = []
        linear.forEach(c => { l.push(project('4326', '3857', c)); });
        v.push(l);
    });

    // Return an openlayer polygon from the list of vertexes
    return new Polygon(v);
}

/**
 * Return the coordinates of the middle point between the two provided positions.
 * @param {array} position1 Coordinates of first position.
 * @param {array} position2 Coordinates of second position.
 * @return {array}          Coordinates of the middle position.
 */
function middle(position1, position2) {
    let x1, y1, x2, y2;
    [x1, y1] = position1;
    [x2, y2] = position2;
    return [(x1 + x2) / 2, (y1 + y2) / 2];
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

/**
 * Return the angle of the line formed by two coordinates.
 * @param {array} position1 - Coordinates of the first position
 * @param {array} position2 - Coordinates of the first position
 * @return {number} - The angle formed by the two positions.
 */
function angle(position1, position2) {
    let p1 = project('4326', '3857', position1);
    let p2 = project('4326', '3857', position2);
    let x = p2[0] - p1[0];
    let y = p2[1] - p1[1];
    let a = Math.atan2(y, x);
    if (a < 0) { return a + 2 * Math.PI }
    else { return a }
}

/**
 * Project the given coordinates.
 * @param {string} epsg1 - Origin EPSG.
 * @param {string} epsg2 - Destination EPSG.
 * @param {Array} coordinates - Coordinates to project.
 * @returns {Array} - Projected coordinates.
 */
function project(epsg1, epsg2, coordinates) {
    return proj4(proj4.defs('EPSG:' + epsg1), proj4.defs('EPSG:' + epsg2), coordinates);
}

function toLongLat(coordinates) {
    let c = proj4(proj4.defs('EPSG:3857'), proj4.defs('EPSG:4326'), coordinates);
    return new LngLat(c[0], c[1]);
}

/**
 * Get a random point inside a given circle.
 * @param {float} center - Center of the circle.
 * @param {float} radius - Radius of the circle.
 * @returns {Array} - Random point coordinates.
 */
function randomPointInCircle(center, radius) {
    let angle = Math.random() * 2 * Math.PI;
    let hypothenus = Math.sqrt(Math.random()) * radius;
    let adjacent = Math.cos(angle) * hypothenus;
    let opposite = Math.sin(angle) * hypothenus;
    return [center[0] + adjacent, center[1] + opposite]
}

export { buffer, bufferAroundPolygon, middle, within, project, angle, randomPointInCircle, toLongLat }