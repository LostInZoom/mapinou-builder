import Helper from "../characters/helper";
import Layer from "./layer";

class Helpers extends Layer {
    constructor(options) {
        super(options);
        this.layer.layout['icon-image'] = [
            'concat',
            'vegetables:',
            ['get', 'type']
        ]
        this.basemap.addLayer(this);

        if (this.options.coordinates) {
            this.options.coordinates.forEach((coords) => {
                let o = this.options;
                o.coordinates = coords;
                o.layer = this;
                new Helper(o);
            });
        }
    }

    display() {
        this.helpers.forEach((helper) => { helper.display(); })
    }

    hide() {
        this.helpers.forEach((helper) => { helper.hide(); });
    }

    despawn(callback) {
        callback = callback || function () { };
        let amount = this.getActiveHelpers().length;
        let done = 0;
        this.helpers.forEach((helper) => {
            helper.despawn(() => {
                helper.destroy();
                if (++done === amount) { callback(); }
            });
        });
    }

    getHelpers() {
        return this.helpers;
    }

    getActiveHelpers() {
        let a = [];
        this.helpers.forEach((helper) => {
            if (helper.isActive()) { a.push(helper); }
        });
        return a;
    }
}

export default Helpers;