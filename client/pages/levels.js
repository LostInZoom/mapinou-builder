import {inAndOut} from 'ol/easing';

import Tutorial from "../game/tutorial";
import { addClass, makeDiv, hasClass, addClass, removeClass, wait } from "../utils/dom";
import Consent from "./consent";
import Page from "./page";
import Title from "./title";
import { Basemap } from '../cartography/map.js';
import { LevelEdges } from '../utils/svg.js';
import Level from '../game/level.js';

class Levels extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.listen = false;

        this.options.app.forbidRabbits();

        // Define the current advancement
        let progression = {
            position: 2,
            subposition: 3
        };

        this.back = makeDiv(null, 'header-button left', this.options.app.options.svgs.arrowleft);
        this.options.app.header.insert(this.back);

        this.options.app.basemap.fit(this.options.app.options.interface.map.levels, {
            duration: 500,
            easing: inAndOut
        }, () => {
            addClass(this.container, 'page-levels');
            addClass(this.back, 'pop');

            let zoom = this.options.app.basemap.getZoom();
            let levels = this.options.app.options.levels;
            let pos = levels[progression.position];

            this.svg = new LevelEdges({ parent: this.container });
            this.minimaps = [];

            if (pos.type === 'tier') {
                let delay = 200;
                for (let i = 0; i < pos.content.length; i++) {
                    let level = pos.content[i];
                    let px = this.options.app.basemap.getPixel(level.target);

                    let minimapcontainer = makeDiv(null, 'levels-minimap-container');
                    let minimap = makeDiv(null, 'levels-minimap');
                    let state = makeDiv(null, 'levels-state');

                    minimap.append(state);
                    minimapcontainer.append(minimap);
                    minimapcontainer.style.left = px[0] + 'px';
                    minimapcontainer.style.top = px[1] + 'px';
                    this.container.append(minimapcontainer);

                    this.minimaps.push(minimapcontainer);

                    // Create a minimap
                    new Basemap({ app: this.options.app, parent: minimap, class: 'minimap', center: level.target, zoom: zoom + 1 });

                    wait(delay, () => {
                        addClass(minimapcontainer, 'pop');
                        if (i === pos.content.length - 1) {
                            this.listen = true;
                        }
                    });

                    if (i <= progression.subposition) { delay +=300; } 
                
                    wait(delay, () => {
                        if (i < progression.subposition) {
                            let nextpx = this.options.app.basemap.getPixel(pos.content[i + 1].target);
                            this.svg.addLine(px[0], px[1], nextpx[0], nextpx[1]);
                        }
                    });

                    if (i > progression.subposition) {
                        addClass(minimapcontainer, 'remaining');
                        state.innerHTML = this.options.app.options.svgs.unknown;
                    } else {
                        if (i < progression.subposition) {
                            addClass(minimapcontainer, 'finished');
                            state.innerHTML = this.options.app.options.svgs.check;
                        }
                        if (i === progression.subposition) {
                            addClass(minimapcontainer, 'active');
                        }
                        delay += 300;
                    }

                    minimapcontainer.addEventListener('click', () => {
                        if (hasClass(minimapcontainer, 'active') && this.listen) {
                            this.hideElements();
                            wait(500, () => {
                                this.destroy();
                                this.back.remove();
                                this.options.app.page = new Level({
                                    app: this.app,
                                    position: 'current',
                                    params: level
                                });
                            })
                        }
                    });
                }
            }

            this.callback();

            this.back.addEventListener('click', () => {
                if (this.listen) {
                    this.listen = false;
                    this.hideElements();

                    wait(500, () => {
                        this.options.app.basemap.animate({
                            center: this.app.center,
                            zoom: this.options.app.options.interface.map.start.zoom,
                            duration: 500,
                            easing: inAndOut
                        }, () => {
                            this.destroy();
                            this.back.remove();
                            this.options.app.page = new Title({ app: this.app, position: 'current' });
                        });
                    })
                }
            });
        });
    }

    hideElements() {
        removeClass(this.back, 'pop');
        if (this.minimaps) { this.minimaps.forEach((minimap) => { removeClass(minimap, 'pop'); }); }
        if (this.svg) { this.svg.thinOutLines(); }
    }
}

export default Levels;