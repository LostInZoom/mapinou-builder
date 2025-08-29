import Tutorial from "../game/tutorial";
import { addClass, makeDiv, hasClass, addClass, removeClass, wait, clearElement } from "../utils/dom";
import Page from "./page";
import Title from "./title";
import Basemap from '../cartography/map.js';
import { LevelEdges } from '../utils/svg.js';
import Level from '../game/level.js';
import { easeInOutSine } from '../utils/math.js';
import { ExperiencePanel, NavigationBar, TierPanel } from "./tiers.js";

class Levels extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.listen = false;
        this.init = options.init ?? true;
        this.update = options.update ?? false;

        this.app.forbidRabbits();
        addClass(this.container, 'page-levels');
        this.levels = this.app.options.levels;

        this.progression = this.app.progression;
        // DEBUGGING
        this.progression = { tier: 1, level: 2 };

        this.position = this.progression.tier;
        this.level = this.progression.level;

        this.tier = this.levels[this.position];
        if (this.tier.type === 'tier') {
            new TierPanel({
                page: this,
                tier: this.position,
                level: this.level,
                animate: this.init
            }, () => { this.listen = true; });
        }
        else if (this.tier.type === 'test') {
            new ExperiencePanel({
                page: this,
                number: this.position,
                animate: this.init
            }, () => { this.listen = true; });
        }
        else if (this.tier.type === 'tutorial') {

        }

        this.navigation = new NavigationBar({ page: this });

        // Create the back button to get back to the title screen
        this.back = makeDiv(null, 'header-button left', this.params.svgs.arrowleft);
        this.app.header.insert(this.back);
        this.back.offsetHeight;
        addClass(this.back, 'pop');
        this.back.addEventListener('click', () => {
            if (this.listen) {
                this.listen = false;
                this.hideElements(() => {
                    this.unobserveSize();
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

    getTier() {
        return this.tier;
    }

    slide(direction) {
        if (this.listen) {
            this.minimaptrash = this.minimaps;
            this.minimaptrash.forEach(minimap => { minimap.loading(); });
            this.unobserveSize();

            // Flag to know direction
            const isPrevious = direction === 'previous';

            if (isPrevious && this.position === 0) { return; }
            else if (isPrevious && this.position >= this.levels.length - 1) { return; }

            const oldcontent = this.currentcontent;
            removeClass(oldcontent, 'current');
            addClass(oldcontent, isPrevious ? 'next' : 'previous');

            this.currentcontent = makeDiv(null, `levels-content-container ${isPrevious ? 'previous' : 'next'}`);
            // Insertion in the dom
            if (isPrevious) { this.container.insertBefore(this.currentcontent, this.container.firstChild); }
            else { this.container.append(this.currentcontent); }

            this.currentcontent.offsetWidth;
            removeClass(this.currentcontent, isPrevious ? 'previous' : 'next');
            addClass(this.currentcontent, 'current');

            this.position = isPrevious ? this.position - 1 : this.position + 1;
            const tier = this.levels[this.position];
            if (tier.type === 'tier') { this.drawTier(this.init); }
            else if (tier.type === 'test') { this.drawTest(this.init); }
            else if (tier.type === 'tutorial') { this.drawTutorial(this.init); }

            // Remove old events
            this.previous.removeEventListener('click', this.previousListener);
            this.next.removeEventListener('click', this.nextListener);
            removeClass(this.current, 'current');
            this.current.innerHTML = '';

            const element = makeDiv(null, `levels-tier-entry ${isPrevious ? 'previous' : 'next'} shrink`, this.params.svgs[isPrevious ? 'arrowleft' : 'arrowright']);

            // Update class conditionally
            addClass(isPrevious ? this.next : this.previous, 'shrink');
            addClass(this.current, isPrevious ? 'next' : 'previous');
            removeClass(isPrevious ? this.previous : this.next, isPrevious ? 'previous' : 'next');
            addClass(isPrevious ? this.previous : this.next, 'current');

            // Update name
            (isPrevious ? this.previous : this.next).innerHTML = tier.name;
            // Insertion in the dom
            if (isPrevious) { this.tiercontainer.insertBefore(element, this.tiercontainer.firstChild); }
            else { this.tiercontainer.append(element); }
            element.offsetHeight;
            removeClass(element, 'shrink');

            wait(500, () => {
                this.minimaptrash.forEach(minimap => { minimap.remove(); });
                oldcontent.remove();

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