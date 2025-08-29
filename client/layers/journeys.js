import * as turf from "@turf/turf";

import Layer from "./layer";
import { getColorsByClassNames } from "../utils/parse";

class Journeys extends Layer {
    constructor(options) {
        super(options);
        this.router = this.options.router;
        this.color = this.options.color || 'white';
        this.maxlength = this.options.maxlength || 3000;
        this.faderate = this.options.faderate || 2;
        this.width = this.options.width || 6;
        this.fading = false;

        this.coordinates = [];
        this.source.type = "geojson";
        this.source.lineMetrics = true;
        this.source.data = {
            type: "Feature",
            geometry: {
                type: "LineString",
                coordinates: this.coordinates
            }
        };

        let colors = getColorsByClassNames('routing-' + this.color);
        let color = colors['routing-' + this.color];
        let transparent = "rgba(255, 255, 255, 0)";

        this.layer.type = 'line';
        this.layer.source = this.id;
        this.layer.paint = {
            "line-width": 6,
            "line-gradient": [
                "interpolate",
                ["linear"],
                ["line-progress"],
                0, transparent,
                1, color,
            ]
        };
        this.layer.layout = {
            "line-cap": "round",
            "line-join": "round"
        };
        this.basemap.addLayer(this);

        if (this.behind) {
            this.basemap.map.moveLayer(this.id, this.behind);
        }
    }

    update(coordinates) {
        this.coordinates.push(coordinates);
        if (this.coordinates.length >= 2) {
            while (turf.length(turf.lineString(this.coordinates), { units: 'meters' }) > this.maxlength) {
                this.coordinates.shift();
            }
        }
        this.updateSource();
    }

    despawn(callback) {
        const start = performance.now();
        const animation = (time) => {
            const t = Math.min((time - start) / this.router.player.getSpawnDuration(), 1);
            const eased = 1 - (1 - t) * (1 - t);
            const width = this.width * (1 - eased);
            this.basemap.map.setPaintProperty(this.id, "line-width", width);
            if (t < 1) {
                requestAnimationFrame(animation);
            } else {
                this.basemap.map.setPaintProperty(this.id, "line-width", 0);
                if (callback) {
                    this.stopFade();
                    this.clear();
                    callback();
                };
            }
        }
        requestAnimationFrame(animation);
    }

    fade() {
        this.fading = true;
        const animation = () => {
            if (this.fading) {
                this.coordinates.splice(0, this.faderate);
                this.updateSource();
                if (this.coordinates.length > 0) {
                    requestAnimationFrame(animation);
                }
            }
        }
        requestAnimationFrame(animation);
    }

    stopFade() {
        this.fading = false;
    }

    updateSource() {
        const source = this.basemap.map.getSource(this.id);
        if (source) {
            source.setData({
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: this.coordinates
                }
            });
        }
    }

    clear() {
        this.coordinates = [];
        this.updateSource();
    }
}

export default Journeys;