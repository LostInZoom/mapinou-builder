import {inAndOut} from 'ol/easing';

import Tutorial from "../game/tutorial";
import { addClass, makeDiv, hasClass, addClass, removeClass, wait } from "../utils/dom";
import Consent from "./consent";
import Page from "./page";
import Title from "./title";
import { Basemap } from '../cartography/map.js';

class Levels extends Page {
    constructor(options, callback) {
        super(options, callback);

        // Define the current advancement
        let progression = {
            position: 2,
            subposition: 2
        };

        this.back = makeDiv(null, 'header-button-back', this.options.app.options.svgs.arrowleft);
        this.container.append(this.back);

        this.options.app.basemap.fit(this.options.app.options.interface.map.levels, {
            duration: 500,
            easing: inAndOut
        }, () => {
            addClass(this.container, 'page-levels');
            addClass(this.back, 'pop');

            let zoom = this.options.app.basemap.getZoom();
            let levels = this.options.app.options.levels;
            let pos = levels[progression.position];

            if (pos.type === 'tier') {
                for (let i = 0; i < pos.content.length; i++) {
                    let level = pos.content[i];
                    let px = this.options.app.basemap.getPixel(level.minimap);
                    let minimap = makeDiv(null, 'levels-minimap');
                    minimap.style.left = px[0] + 'px';
                    minimap.style.top = px[1] + 'px';

                    this.basemap = new Basemap({
                        parent: minimap,
                        class: 'minimap',
                        center: level.minimap,
                        zoom: zoom + 1
                    })

                    this.container.append(minimap);
                    minimap.offsetHeight;
                    addClass(minimap, 'pop');

                    if (i === progression.subposition) {
                        addClass(minimap, 'active');
                    }

                    
                }
            }











            this.back.addEventListener('click', () => {
                this.listen = false;
                removeClass(this.back, 'pop');
                wait(300, () => {
                    this.options.app.basemap.animate({
                        center: this.options.app.options.interface.map.start.center,
                        zoom: this.options.app.options.interface.map.start.zoom,
                        duration: 500,
                        easing: inAndOut
                    }, () => {
                        this.destroy();
                        this.options.app.page = new Title({ app: this.app, position: 'current' });
                    });
                })
            });
        });












        

        

        this.content = makeDiv(null, 'page-content');
        this.text = makeDiv(null, 'levels-text');
        this.hint = makeDiv(null, 'levels-text-hint',
            `Les niveaux se débloquent dans l'ordre.<br>
            Commencez par faire le tutoriel avant de progresser.`
        );
        this.text.append(this.hint);
        this.content.append(this.text);
        
        this.levels = [];
        this.tutorial = makeDiv(null, 'levels-test-button levels-button', 'Tutoriel');

        this.tutorial.addEventListener('click', () => {
            // this.options.app.basemap.loading();
            // new Tutorial(this.options.app.options.tutorial);
        });

        this.tiers = makeDiv(null, 'levels-tiers');

        

        let delay = this.app.options.interface.transition.page;

        wait(delay, () => {
            
            addClass(this.tutorial, 'pop');
        });

        delay += 250;

        let tierlist = [];
        let levelnumber = 1;
        let className = 'done';

        // for (let i = 0; i < this.app.options.levels.length; i++) {
        //     let l = this.app.options.levels[i];
        //     if (l.type === 'level') {
        //         let level = makeDiv(null, 'levels-tier-button levels-button', levelnumber);
        //         if (this.app.options.state.type === 'level' && this.app.options.state.position === levelnumber) {
        //             addClass(level, 'active');
        //             className = 'disabled';
        //         } else {
        //             addClass(level, className);
        //         }
        //         tierlist.push(level);
        //         ++levelnumber;

        //         wait(delay, () => { addClass(level, 'pop'); });
        //         delay += 50;

        //         level.addEventListener('click', () => {
        //             if (hasClass(level, 'active')) {
        //                 // Start new level
        //             };
        //         });
        //     } else {
        //         let tier = makeDiv(null, 'levels-tier');
        //         tierlist.forEach((lvl) => { tier.append(lvl); });
        //         this.tiers.append(tier);
        //         tierlist = [];
                
        //         let test = makeDiv(null, 'levels-test-button levels-button', l.name);
        //         this.tiers.append(test);

        //         if (this.app.options.state.type === 'test' && this.app.options.state.position === l.name) {
        //             addClass(test, 'active');
        //             className = 'disabled';
        //         } else {
        //             addClass(test, className);
        //         }

        //         delay += 200;
        //         wait(delay, () => { addClass(test, 'pop'); });
        //         delay += 250;

        //         test.addEventListener('click', () => {
        //             if (hasClass(test, 'active')) {
        //                 // Start new expérience
        //             };
        //         });
        //     }
        // }

        // if (tierlist.length > 0) {
        //     let tier = makeDiv(null, 'levels-tier');
        //     tierlist.forEach((lvl) => { tier.append(lvl); });
        //     this.tiers.append(tier);
        // }

        // wait(delay, this.callback);
    
        
    }

    title() {

    }
}

export default Levels;