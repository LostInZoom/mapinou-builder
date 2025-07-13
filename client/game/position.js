import { radiansToDegrees } from "@turf/turf";
import { angle } from "../cartography/analysis";
import { addClass, removeClass, hasClass, wait, makeDiv } from "../utils/dom";

class Position {
    constructor(options) {
        this.basemap = options.basemap;
        this.player = options.player;

        this.container = makeDiv(null, 'level-position-container');
        this.marker = makeDiv(null, 'level-position');
        this.container.append(this.marker);
        this.basemap.container.append(this.container);

        this.padding = 20;
        let width = this.basemap.container.offsetWidth;
        let height = this.basemap.container.offsetHeight;

        const center = [width / 2, height / 2];
        this.aNW = angle(center, [0, 0]);
        this.aNE = angle(center, [width, 0]);
        this.aSW = angle(center, [0, height]);
        this.aSE = angle(center, [width, height]);

        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
        this.mapHeight = this.basemap.getHeight();
        this.mapWidth = this.basemap.getWidth();
    }

    update() {
        if (this.basemap.isVisible(this.player.getCoordinates(), 0)) {
            this.hide();
        } else {
            this.reveal();

            let [x2, y2] = this.basemap.map.getPixelFromCoordinate(this.player.getCoordinates());
            let [x3, y3] = [undefined, undefined];
            let a = undefined;

            let paddingW = this.padding + this.width / 2;
            let paddingH = this.padding + this.height / 2;

            let [ xmin, ymin ] = [ paddingW, paddingH ];
            let [ xmax, ymax ] = [ this.mapWidth - paddingW, this.mapHeight - paddingH ]
            let rotation = 135;

            if (x2 < xmin) { x3 = xmin; a = 180; }
            if (x2 > xmax) { x3 = xmax; a = 0; }
            if (y2 < ymin) { y3 = ymin; a = 90; }
            if (y2 > ymax) { y3 = ymax; a = -90; }
            if (x3 && y3) { a = -radiansToDegrees(angle([x3, y3], [x2, y2])); }
            else {
                if (x3 === undefined) { x3 = x2; }
                if (y3 === undefined) { y3 = y2; }
            }

            this.container.style.top = y3 + 'px';
            this.container.style.left = x3 + 'px';
            this.container.style.transform = `translate(-50%, -50%) rotate(${rotation - a}deg)`;
        }
    }

    calculate(value, state) {
        let c = state === 'top' ? this.height : this.width;
        let mc = state === 'top' ? this.mapHeight : this.mapWidth;
        let [ min, max ] = [ this.padding + c / 2, mc - this.padding - c / 2 ];
        if (value > max) { value = max; }
        else if (value < min) { value = min; }
        return value;
    }

    reveal(callback) {
        callback = callback || function() {};
        if (hasClass(this.marker, 'pop')) { callback(); }
        else {
            addClass(this.marker, 'pop');
            wait(300, callback);
        }
    }

    hide(callback) {
        callback = callback || function() {};
        if (!hasClass(this.marker, 'pop')) { callback(); }
        else {
            removeClass(this.marker, 'pop');
            wait(300, callback);
        }
    }

    destroy(callback) {
        callback = callback || function() {};
        this.hide(() => {
            this.container.remove();
            callback();
        });
    }
}

export default Position;