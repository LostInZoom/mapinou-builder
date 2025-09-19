import Page from '../pages/page.js';
import { makeDiv, addClass, removeClass, wait } from '../utils/dom.js';
import Basemap from '../cartography/map.js';
import { generateRandomInteger } from '../utils/math.js';
import { Header } from '../pages/elements.js';

import Title from '../pages/title.js';
import Roamer from '../characters/roamer.js';
import { Music, SoundEffects } from '../utils/soundbuttons.js';
import Rabbits from '../layers/rabbits.js';
import Builder from './builder.js';

class Application {
    constructor(options) {
        this.options = options;
        this.progression = options.progression;
        this.debug = true;
        this.currentGame = {};

        // Create the DOM Element
        this.container = makeDiv('application', null);
        document.body.append(this.container);

        this.header = new Header(this);

        this.mask = makeDiv(null, 'mask');
        this.loader = makeDiv(null, 'loader');
        this.mask.append(this.loader);
        this.container.append(this.mask);

        // Display the loader
        this.loading();

        // Boolean to flag if the page is sliding
        this.sliding = false;

        this.basemap = new Basemap({
            app: this,
            parent: this.container,
            class: 'basemap',
            center: this.center,
            extent: this.options.interface.map.start,
            interactive: true
        }, () => {
            this.basemap.loadSprites().then(() => {
                this.loaded();
                this.allowed = true;

                new Builder({
                    app: this,
                    basemap: this.basemap
                });
            });
        });
    }

    /**
     * 
     * @param {str} position - New position of the current page
     * @param {Page} page - The new page to display
     * @param {*} callback 
     */
    slide(options, callback) {
        callback = callback || function () { };

        // Make sure the page isn't sliding
        if (!this.sliding) {
            this.sliding = true;

            if (options.position === 'previous') { this.basemap.slide('right'); }
            else { this.basemap.slide('left'); }

            this.page.setPosition(options.position);
            options.page.setPosition('current');

            wait(this.options.interface.transition.page, () => {
                this.page.destroy();
                this.page = options.page;
                this.sliding = false;
                callback();
            })
        }
    }

    allowRabbits() {
        this.allowed = true;
    }

    forbidRabbits() {
        this.allowed = false;
    }

    hasRabbits() {
        if (this.rabbits.getNumber() > 0) { return true; }
        else { return false; }
    }

    killRabbits() {
        this.rabbits.despawnCharacters(() => {
            this.rabbits.destroy();
        });
    }

    loading() {
        removeClass(this.mask, 'loaded');
    }

    loaded() {
        addClass(this.mask, 'loaded');
    }

    getProgression(previous) {
        if (this.debug) { return { tier: 1, level: 0 }; }
        if (previous) {
            if (this.progression.level === 0) {
                return { tier: this.progression.tier - 1, level: 0 }
            } else {
                return { tier: this.progression.tier, level: this.progression.level - 1 }
            }
        } else {
            return this.progression;
        }
    }

    progress() {
        let t = this.progression.tier;
        let l = this.progression.level;
        const tier = this.options.levels[t];
        if (tier.type === 'tier') {
            if (l >= tier.content.length - 1) {
                this.progression.tier = t + 1;
                this.progression.level = 0;
            } else {
                this.progression.level = l + 1;
            }
        } else {
            this.progression.tier = t + 1;
            this.progression.level = 0;
        }
        localStorage.setItem('tier', this.progression.tier);
        localStorage.setItem('level', this.progression.level);
    }
}

export default Application;