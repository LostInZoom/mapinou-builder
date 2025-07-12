import Page from '../pages/page.js';
import { makeDiv, addSVG, addClass, hasClass, removeClass, wait } from '../utils/dom.js';
import { MainMap } from '../cartography/map.js';
import { easeInOutCubic, generateRandomInteger } from '../utils/math.js';
import { Header } from '../interface/elements.js';

import Title from '../pages/title.js';
import Consent from '../pages/consent.js';
import Form from '../pages/form.js';
import Levels from '../pages/levels.js';
import Roamer from '../characters/roamer.js';
import { Music, SoundEffects } from '../utils/soundbuttons.js';

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
        this.loading();

        this.rabbits = [];
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

        this.basemap = new MainMap({
            app: this,
            parent: this.container,
            class: 'basemap',
            center: this.center,
            zoom: this.options.interface.map.start.zoom
        }, () => {
            this.loaded();
            // Create the current page
            this.page = new Levels({
                app: this,
                position: 'current',
                init: true
            }, () => {
                this.music.display(true);
                this.sounds.display(false);
            });
        });

        // Rabbit spawner
        this.allowed = true;
        this.basemap.map.on('click', (e) => {
            if (this.allowed) {
                this.allowed = false;
                let coords = this.basemap.map.getEventCoordinate(event);
                let rabbit = new Roamer({
                    basemap: this.basemap,
                    coordinates: coords,
                    color: 'random',
                    speed: this.options.game.speed.roaming
                });

                if (this.rabbits.length >= this.maxrabbit) {
                    this.rabbits.shift().despawn();
                }

                rabbit.spawn(() => {
                    this.rabbits.push(rabbit);
                    rabbit.roam();
                    this.allowed = true;
                });
            }
        });
    }

    /**
     * 
     * @param {str} position - New position of the current page
     * @param {Page} page - The new page to display
     * @param {*} callback 
     */
    slide(options, callback) {
        callback = callback || function() {};

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
        if (this.rabbits.length > 0) { return true; }
        else { return false; }
    }

    killRabbits() {
        while (this.rabbits.length > 0) {
            this.rabbits.pop().despawn();
        }
    }

    loading() {
        removeClass(this.mask, 'loaded');
    }

    loaded() {
        addClass(this.mask, 'loaded');
    }
}

export default Application;