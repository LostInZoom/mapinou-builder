import Page from '../pages/page.js';
import { makeDiv, addSVG, addClass, hasClass, removeClass, wait } from '../utils/dom.js';
import { Basemap } from '../cartography/map.js';
import { Roamer } from '../characters/rabbit.js';
import { easeInOutCubic } from '../utils/math.js';
import { Header } from '../interface/elements.js';
import { Music } from '../utils/audio.js';

import Title from '../pages/title.js';
import Consent from '../pages/consent.js';
import Form from '../pages/form.js';
import Levels from '../pages/levels.js';

class Application {
    constructor(options) {
        this.options = options;

        console.log(options);

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

        this.basemap = new Basemap({
            parent: this,
            class: 'basemap',
            center: [ 291041.84, 5629996.16 ],
            zoom: 15
        }, () => {
            this.loaded();
            // Create the current page
            this.page = new Title({
                app: this,
                position: 'current'
            }, () => {
                this.music.displayButton();
            });
        });

        // Rabbit spawner
        let listen = true;
        this.basemap.map.on('click', (e) => {
            if (listen) {
                listen = false;
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
                    listen = true;
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