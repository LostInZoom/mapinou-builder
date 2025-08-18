import { inAndOut } from 'ol/easing';

import Tutorial from "../game/tutorial";
import { addClass, makeDiv, hasClass, addClass, removeClass, wait } from "../utils/dom";
import Consent from "./consent";
import Page from "./page";
import Title from "./title";
import Basemap from '../cartography/map.js';
import { LevelEdges } from '../utils/svg.js';
import Level from '../game/level.js';

class Levels extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.listen = false;
        this.initState = options.initState || 'init';

        this.progression = this.app.progression;
        // DEBUGGING
        this.progression = { tier: 2, level: 4 };

        this.app.forbidRabbits();

        this.back = makeDiv(null, 'header-button left', this.params.svgs.arrowleft);
        this.app.header.insert(this.back);

        this.basemap.fit(this.params.interface.map.levels, {
            duration: 500,
            easing: inAndOut
        }, () => {
            this.mapCenter = this.basemap.getCenter();
            this.mapZoom = this.basemap.getZoom();

            addClass(this.container, 'page-levels');
            addClass(this.back, 'pop');

            let zoom = this.app.basemap.getZoom();
            let levels = this.app.options.levels;
            let pos = levels[this.progression.tier];

            let tierClass = '';
            if (this.initState === 'slide') { tierClass = ' pop'; }

            this.tiercontainer = makeDiv(null, 'levels-tier-container' + tierClass);
            this.tierprevious = makeDiv(null, 'levels-tier-entry levels-tier-previous', this.params.svgs.arrowleft);
            this.tiercurrent = makeDiv(null, 'levels-tier-entry levels-tier-current');
            this.tierfollowing = makeDiv(null, 'levels-tier-entry levels-tier-following', this.params.svgs.arrowright);
            this.tiercontainer.append(this.tierprevious, this.tiercurrent, this.tierfollowing);
            this.container.append(this.tiercontainer);

            if (this.initState !== 'slide') {
                this.tiercontainer.offsetHeight;
                addClass(this.tiercontainer, 'pop');
            }

            let animation = this.initState === 'slide' ? false : true;

            this.svg = new LevelEdges({ parent: this.container, animation: animation });
            this.minimapscontainer = [];
            this.minimaps = [];

            const observer = new ResizeObserver(() => {
                this.svg.resize(this.getWidth(), this.getHeight());
                for (let i = 0; i < this.minimapscontainer.length; i++) {
                    let minimap = this.minimapscontainer[i];
                    let position = [parseFloat(minimap.getAttribute('x')), parseFloat(minimap.getAttribute('y'))];
                    let px = this.app.basemap.getPixel(position);
                    minimap.style.left = px[0] + 'px';
                    minimap.style.top = px[1] + 'px';

                    if (i < this.minimapscontainer.length - 1) { this.svg.moveLineStart(i, px[0], px[1]); }
                    if (i > 0) { this.svg.moveLineEnd(i - 1, px[0], px[1]); }
                }
            });

            if (pos.type === 'tier') {
                let delay = 200;

                for (let i = 0; i < pos.content.length; i++) {
                    let level = pos.content[i];
                    let px = this.app.basemap.getPixel(level.target);

                    this.tiercurrent.innerHTML = 'Phase ' + this.progression.tier;

                    let minimapClass = '';
                    if (this.initState === 'slide') {
                        minimapClass = ' pop';
                        this.listen = true;
                    }

                    let minimapcontainer = makeDiv(null, 'levels-minimap-container' + minimapClass);
                    minimapcontainer.setAttribute('x', level.target[0]);
                    minimapcontainer.setAttribute('y', level.target[1]);

                    let minimap = makeDiv(null, 'levels-minimap');
                    let state = makeDiv(null, 'levels-state');

                    minimap.append(state);
                    minimapcontainer.append(minimap);
                    minimapcontainer.style.left = px[0] + 'px';
                    minimapcontainer.style.top = px[1] + 'px';
                    this.container.append(minimapcontainer);

                    this.minimapscontainer.push(minimapcontainer);
                    this.minimaps.push(
                        new Basemap({
                            app: this.options.app,
                            parent: minimap,
                            class: 'minimap',
                            center: level.target,
                            zoom: zoom + 1
                        })
                    );


                    if (this.initState !== 'slide') {
                        wait(delay, () => {
                            addClass(minimapcontainer, 'pop');
                            if (i === pos.content.length - 1) { this.listen = true; }
                        });
                        if (i < this.progression.level) { delay += 300; }
                    }

                    if (this.initState !== 'slide') {
                        wait(delay, () => {
                            if (i < this.progression.level - 1) {
                                let nextpx = this.options.app.basemap.getPixel(pos.content[i + 1].target);
                                this.svg.addLine(px[0], px[1], nextpx[0], nextpx[1], i, i + 1);
                            }
                        });
                    } else {
                        if (i < this.progression.level - 1) {
                            let nextpx = this.options.app.basemap.getPixel(pos.content[i + 1].target);
                            this.svg.addLine(px[0], px[1], nextpx[0], nextpx[1], i, i + 1);
                        }
                    }

                    if (i >= this.progression.level) {
                        addClass(minimapcontainer, 'remaining');
                        state.innerHTML = this.options.app.options.svgs.unknown;
                    } else {
                        if (i < this.progression.level - 1) {
                            addClass(minimapcontainer, 'finished');
                            state.innerHTML = this.options.app.options.svgs.check;
                        }
                        if (i === this.progression.level - 1) {
                            addClass(minimapcontainer, 'active');
                        }
                        delay += 300;
                    }

                    minimapcontainer.addEventListener('click', () => {
                        if (hasClass(minimapcontainer, 'active') && this.listen) {
                            this.hideElements(() => {
                                observer.unobserve(this.container);
                                this.destroy();
                                this.back.remove();
                                this.app.page = new Level({
                                    app: this.app,
                                    levels: this,
                                    position: 'current',
                                    params: level
                                });
                            });
                        }
                    });
                }
            }

            observer.observe(this.container);

            this.callback();

            this.back.addEventListener('click', () => {
                if (this.listen) {
                    this.listen = false;
                    this.hideElements(() => {
                        observer.unobserve(this.container);
                        this.options.app.basemap.animate({
                            center: this.app.center,
                            zoom: this.params.interface.map.start.zoom,
                            duration: 500,
                            easing: inAndOut
                        }, () => {
                            this.destroy();
                            this.back.remove();
                            this.app.page = new Title({ app: this.app, position: 'current' });
                        });
                    });
                }
            });
        });
    }

    hideElements(callback) {
        callback = callback || function () { };
        removeClass(this.back, 'pop');
        removeClass(this.tiercontainer, 'pop');
        if (this.minimapscontainer) { this.minimapscontainer.forEach((minimap) => { removeClass(minimap, 'pop'); }); }
        if (this.svg) { this.svg.thinOutLines(); }

        wait(500, () => {
            this.minimaps.forEach((minimap) => { minimap.dispose(); });
            callback();
        });
    }
}

export default Levels;