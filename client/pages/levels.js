import Tutorial from "../game/tutorial";
import { addClass, makeDiv, hasClass, addClass, removeClass, wait } from "../utils/dom";
import Page from "./page";
import Title from "./title";
import Basemap from '../cartography/map.js';
import { LevelEdges } from '../utils/svg.js';
import Level from '../game/level.js';
import { easeInOutSine } from '../utils/math.js';

class Levels extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.listen = false;
        this.init = options.init ?? true;
        this.update = options.update ?? false;

        this.progression = this.app.progression;
        // DEBUGGING
        this.progression = { tier: 0, level: 2 };

        this.app.forbidRabbits();

        this.back = makeDiv(null, 'header-button left', this.params.svgs.arrowleft);
        this.app.header.insert(this.back);
        this.back.offsetHeight;

        addClass(this.container, 'page-levels');
        addClass(this.back, 'pop');

        this.levels = this.app.options.levels;

        this.tiercontainer = makeDiv(null, 'levels-tier-container');
        this.previous = makeDiv(null, 'levels-tier-entry previous', this.params.svgs.arrowleft);
        this.current = makeDiv(null, 'levels-tier-entry current');
        this.next = makeDiv(null, 'levels-tier-entry next', this.params.svgs.arrowright);
        this.tiercontainer.append(this.previous, this.current, this.next);
        this.container.append(this.tiercontainer);

        this.tiercontainer.offsetHeight;
        addClass(this.tiercontainer, 'pop');

        this.position = this.levels[this.progression.tier];

        if (this.position.type === 'tier') { this.drawTier('current'); }
        else if (this.position.type === 'experience') { this.drawExperience('current'); }
        else if (this.position.type === 'tutorial') { this.drawTutorial('current'); }

        this.previousListener = () => { this.slide('previous'); };
        this.nextListener = () => { this.slide('next'); };

        this.previous.addEventListener('click', this.previousListener);
        this.next.addEventListener('click', this.nextListener);
    }

    /**
     * Draw a tier style page
     */
    drawTier(position) {
        // this.init = false;

        this.contentcontainer = makeDiv(null, 'levels-content-container ' + position);
        this.container.append(this.contentcontainer);

        this.current.innerHTML = this.position.name;

        this.svg = new LevelEdges({ parent: this.contentcontainer, animation: this.init });
        this.minimapscontainer = [];
        this.minimaps = [];

        this.observer = new ResizeObserver(() => {
            this.basemap.fit(this.params.interface.map.levels, { duration: 0 });
            this.svg.resize(this.getWidth(), this.getHeight());
            for (let i = 0; i < this.minimapscontainer.length; i++) {
                let minimap = this.minimapscontainer[i];
                this.minimaps[i].setZoom(this.basemap.getZoom() + 1);
                let p = [parseFloat(minimap.getAttribute('x')), parseFloat(minimap.getAttribute('y'))];
                let px = this.app.basemap.getPixelAtCoordinates(p);
                minimap.style.left = px[0] + 'px';
                minimap.style.top = px[1] + 'px';
                if (i < this.minimapscontainer.length - 1) { this.svg.moveLineStart(i, px[0], px[1]); }
                if (i > 0) { this.svg.moveLineEnd(i - 1, px[0], px[1]); }
            }
        });

        let animate = position === 'current' && this.init ? true : false;

        let delay = 200;
        for (let i = 0; i < this.position.content.length; i++) {
            let level = this.position.content[i];
            let px = this.app.basemap.getPixelAtCoordinates(level.target);

            let minimapcontainer = makeDiv(null, 'levels-minimap-container');
            if (!animate) { addClass(minimapcontainer, 'pop'); }
            minimapcontainer.setAttribute('x', level.target[0]);
            minimapcontainer.setAttribute('y', level.target[1]);

            let minimap = makeDiv(null, 'levels-minimap');
            let state = makeDiv(null, 'levels-state');

            minimap.append(state);
            minimapcontainer.append(minimap);
            minimapcontainer.style.left = px[0] + 'px';
            minimapcontainer.style.top = px[1] + 'px';
            this.contentcontainer.append(minimapcontainer);

            if (animate) {
                wait(delay, () => {
                    addClass(minimapcontainer, 'pop');
                    if (i === this.position.content.length - 1) { this.listen = true; }
                });
                if (i < this.progression.level) { delay += 300; }

                wait(delay, () => {
                    if (i < this.progression.level - 1) {
                        let nextpx = this.options.app.basemap.getPixelAtCoordinates(this.position.content[i + 1].target);
                        this.svg.addLine(px[0], px[1], nextpx[0], nextpx[1], i, i + 1);
                    }
                });
            } else {
                if (i < this.progression.level - 1) {
                    let nextpx = this.options.app.basemap.getPixelAtCoordinates(this.position.content[i + 1].target);
                    this.svg.addLine(px[0], px[1], nextpx[0], nextpx[1], i, i + 1);
                }
            }

            if (i >= this.progression.level) {
                addClass(minimapcontainer, 'remaining');
                state.innerHTML = this.options.app.options.svgs.lock;
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
                        this.observer.unobserve(this.container);
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

            this.minimapscontainer.push(minimapcontainer);
            this.minimaps.push(new Basemap({
                app: this.options.app,
                parent: minimap,
                class: 'minimap',
                center: level.target,
                zoom: this.basemap.getZoom() + 1,
                interactive: false
            }));
        }

        this.observer.observe(this.container);

        this.back.addEventListener('click', () => {
            if (this.listen) {
                this.listen = false;
                this.hideElements(() => {
                    this.observer.unobserve(this.container);
                    this.options.app.basemap.animate({
                        center: this.app.center,
                        zoom: this.params.interface.map.start.zoom,
                        duration: 500,
                        easing: easeInOutSine
                    }, () => {
                        this.destroy();
                        this.back.remove();
                        this.app.page = new Title({ app: this.app, position: 'current' });
                    });
                });
            }
        });
    }

    drawExperience(position) {

    }

    drawTutorial(position) {

    }

    slide(direction) {
        if (this.observer) this.observer.unobserve(this.container);

        // Remove old events
        this.previous.removeEventListener('click', this.previousListener);
        this.next.removeEventListener('click', this.nextListener);
        removeClass(this.current, 'current');
        this.current.innerHTML = '';

        // Flag to know direction
        const isPrevious = direction === 'previous';
        const element = makeDiv(null, `levels-tier-entry ${isPrevious ? 'previous' : 'next'} shrink`, this.params.svgs[isPrevious ? 'arrowleft' : 'arrowright']);

        // Update class conditionally
        addClass(isPrevious ? this.next : this.previous, 'shrink');
        addClass(this.current, isPrevious ? 'next' : 'previous');
        removeClass(isPrevious ? this.previous : this.next, isPrevious ? 'previous' : 'next');
        addClass(isPrevious ? this.previous : this.next, 'current');

        // Update name
        (isPrevious ? this.previous : this.next).innerHTML = isPrevious ? 'Expérience 2' : 'Expérience 1';
        // Insertion in the dom
        if (isPrevious) { this.tiercontainer.insertBefore(element, this.tiercontainer.firstChild); }
        else { this.tiercontainer.append(element); }
        element.offsetHeight;
        removeClass(element, 'shrink');

        wait(200, () => {
            // Remove hidden button
            (isPrevious ? this.next : this.previous).remove();
            // Add new svg arrow
            this.current.innerHTML = this.params.svgs[isPrevious ? 'arrowright' : 'arrowleft'];
            // Reassign new buttons
            if (isPrevious) {
                this.next = this.current;
                this.current = this.previous;
                this.previous = element;
            } else {
                this.previous = this.current;
                this.current = this.next;
                this.next = element;
            }

            // Remake new listeners
            this.previous.addEventListener('click', this.previousListener);
            this.next.addEventListener('click', this.nextListener);
        });
    }

    hideElements(callback) {
        callback = callback || function () { };
        removeClass(this.back, 'pop');
        removeClass(this.tiercontainer, 'pop');
        if (this.minimapscontainer) { this.minimapscontainer.forEach((minimap) => { removeClass(minimap, 'pop'); }); }
        if (this.svg) { this.svg.thinOutLines(); }

        wait(500, () => {
            this.minimaps.forEach((minimap) => { minimap.remove(); });
            callback();
        });
    }
}

export default Levels;