import { within } from "../cartography/analysis";
import Helper from "../characters/helper";
import Characters from "./characters";

class Helpers extends Characters {
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

    handle(position) {
        for (let i = 0; i < this.characters.length; i++) {
            let helper = this.characters[i];
            if (within(position, helper.getCoordinates(), this.params.game.visibility.helpers)) {
                if (helper.isVisible()) { helper.hide(); }
            }
            else {
                if (!helper.isVisible()) {
                    helper.reveal(() => {
                        helper.breathe();
                    });
                }
                // Consume them if within consuming range
                if (within(position, helper.getCoordinates(), this.params.game.tolerance.helpers)) {
                    helper.consume();
                    this.level.score.addModifier('helpers');
                }
            }
        }
    }
}

export default Helpers;