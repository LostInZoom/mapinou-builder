import * as turf from "@turf/turf";

import Layer from "./layer";
import { getColorsByClassNames } from "../utils/parse";

class Journeys extends Layer {
    constructor(options) {
        super(options);
        this.color = this.options.color || 'white';
        this.maxlength = this.options.maxlength || 3000;
        this.faderate = this.options.faderate || 2;
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
        this.layer.type = 'line';
        this.layer.source = this.id;
        this.layer.paint = {
            "line-width": 6,
            "line-gradient": [
                "interpolate",
                ["linear"],
                ["line-progress"],
                0, "rgba(255, 255, 255, 0)",
                1, colors['routing-' + this.color]
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