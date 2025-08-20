import Page from '../pages/page.js';
import { makeDiv, addSVG, addClass, hasClass, removeClass, wait } from '../utils/dom.js';
import Basemap from '../cartography/map.js';
import { easeInOutCubic, generateRandomInteger } from '../utils/math.js';
import { Header } from '../interface/elements.js';

import Title from '../pages/title.js';
import Consent from '../pages/consent.js';
import Form from '../pages/form.js';
import Levels from '../pages/levels.js';
import Roamer from '../characters/roamer.js';
import { Music, SoundEffects } from '../utils/soundbuttons.js';
import Rabbits from '../layers/rabbits.js';
import { toLongLat } from '../cartography/analysis.js';

class Application {
    constructor(options) {
        this.options = options;

        // Create the DOM Element
        this.container = makeDiv('application', null);
        document.body.append(this.container);

        this.mask = makeDiv(null, 'mask');
        this.loader = makeDiv(null, 'loader');
        this.mask.append(this.loader);
        this.container.append(this.mask);

        // Display the loader
        this.loading();

        this.maxrabbit = 5;

        // Boolean to flag if the page is sliding
        this.sliding = false;

        this.header = new Header(this);
        this.header.setJustification('right');

        this.music = new Music({
            parent: this.header,
            svg: this.options.svgs.music,
            src: './sounds/theme',
            format: 'mp3',
        });

        this.sounds = new SoundEffects({
            parent: this.header,
            svg: this.options.svgs.sound,
        });

        let centers = this.options.interface.map.start.centers;
        let i = generateRandomInteger(0, centers.length - 1);
        this.center = centers[i];

        this.basemap = new Basemap({
            app: this,
            parent: this.container,
            class: 'basemap',
            center: this.center,
            zoom: this.options.interface.map.start.zoom,
            interactive: false
        }, () => {
            this.loaded();

            // Create the current page
            this.page = new Title({
                app: this,
                basemap: this.basemap,
                position: 'current',
                // initState: 'slide',
                init: true
            }, () => {
                this.music.display(true);
                this.sounds.display(false);
            });

            this.rabbits = new Rabbits({ basemap: this.basemap });
            this.allowed = true;

            this.basemap.map.on('click', (e) => {
                if (this.allowed) {
                    this.allowed = false;
                    let coords = e.lngLat;

                    // if (this.rabbits.getCharactersNumber() >= this.maxrabbit) {
                    //     let first = this.rabbits.getCharacter(0);
                    //     first.despawn(() => {
                    //         this.rabbits.removeCharacter(first);
                    //     });
                    // }

                    let r = new Roamer({
                        layer: this.rabbits,
                        coordinates: [ coords.lng, coords.lat ],
                        color: 'random',
                    });

                    this.allowed = true;

                    // // Despawn the first rabbit if the limit is reached
                    // if (this.rabbits.getCharactersNumber() >= this.maxrabbit) {
                    //     let first = this.rabbits.getCharacter(0);
                    //     first.despawn(() => {
                    //         this.rabbits.removeCharacter(first);
                    //     });
                    // }

                    // let r = new Roamer({
                    //     layer: this.rabbits,
                    //     coordinates: coords,
                    //     color: 'random',
                    // });

                    // r.spawn(() => {
                    //     this.allowed = true;
                    //     r.roam();
                    // });
                }
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

            let center = this.basemap.getCenter();
            let increment = this.basemap.getResolution() * 100;

            if (options.position === 'previous') { center[0] += increment; }
            else { center[0] -= increment; }

            this.basemap.animate({
                center: center,
                duration: 500,
                easing: easeInOutCubic
            });

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
        if (this.rabbits.getCharactersNumber() > 0) { return true; }
        else { return false; }
    }

    killRabbits() {
        this.rabbits.despawnCharacters(() => {
            this.rabbits.clear();
        });
    }

    loading() {
        removeClass(this.mask, 'loaded');
    }

    loaded() {
        addClass(this.mask, 'loaded');
    }
}

export default Application;