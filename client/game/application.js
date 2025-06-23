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

class Application {
    constructor(options) {
        this.options = options;

        console.log(options)

        // Create the DOM Element
        this.container = makeDiv('application', null);
        document.body.append(this.container);

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
            // Create the current page
            this.page = new Title({
                app: this,
                position: 'current',
                question: 0,
                defaultLastAnswer: true
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
    slide(position, page, callback) {
        callback = callback || function() {};

        if (!this.sliding) {
            this.sliding = true;

            let center = this.basemap.getCenter();
            let increment = this.basemap.getResolution() * 100;

            if (position === 'previous') { center[0] += increment; } else { center[0] -= increment; }
            this.basemap.animate({
                center: center,
                duration: 500,
                easing: easeInOutCubic
            });

            this.page.setPosition(position);
            page.setPosition('current');

            wait(this.options.interface.transition.page, () => {
                this.page.destroy();
                this.page = page;
                this.sliding = false;
                callback();
            })
        }
    }
}

export default Application;