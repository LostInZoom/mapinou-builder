import {inAndOut} from 'ol/easing';

import Tutorial from "../game/tutorial";
import { addClass, makeDiv, hasClass, addClass, removeClass, wait } from "../utils/dom";
import Consent from "./consent";
import Page from "./page";
import Title from "./title";
import { Basemap } from '../cartography/map.js';
import { LevelEdges } from '../utils/svg.js';

class Levels extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.listen = false;

        // Define the current advancement
        let progression = {
            position: 2,
            subposition: 3
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

            let svg = new LevelEdges({ parent: this.container });
            let minimaps = [];

            if (pos.type === 'tier') {
                let delay = 200;
                for (let i = 0; i < pos.content.length; i++) {
                    let level = pos.content[i];
                    let px = this.options.app.basemap.getPixel(level.minimap);

                    let minimapcontainer = makeDiv(null, 'levels-minimap-container');
                    let minimap = makeDiv(null, 'levels-minimap');
                    let unknown = makeDiv(null, 'levels-unknown', this.options.app.options.svgs.unknown);

                    minimap.append(unknown);
                    minimapcontainer.append(minimap);
                    minimapcontainer.style.left = px[0] + 'px';
                    minimapcontainer.style.top = px[1] + 'px';
                    this.container.append(minimapcontainer);

                    minimaps.push(minimapcontainer);

                    // Create a minimap
                    new Basemap({ parent: minimap, class: 'minimap', center: level.minimap, zoom: zoom + 1 });

                    wait(delay, () => {
                        addClass(minimapcontainer, 'pop');
                        if (i === pos.content.length - 1) {
                            this.listen = true;
                        }
                    });

                    if (i <= progression.subposition) { delay +=300; } 
                
                    wait(delay, () => {
                        if (i < progression.subposition) {
                            let nextpx = this.options.app.basemap.getPixel(pos.content[i + 1].minimap);
                            svg.addLine(px[0], px[1], nextpx[0], nextpx[1]);
                        }
                    });

                    if (i > progression.subposition) {
                        addClass(minimapcontainer, 'remaining');
                    } else {
                        if (i < progression.subposition) {
                            addClass(minimapcontainer, 'finished');
                        }
                        if (i === progression.subposition) {
                            addClass(minimapcontainer, 'active');
                        }
                        delay += 300;
                    }
                }
            }

            this.back.addEventListener('click', () => {
                if (this.listen) {
                    this.listen = false;
                    removeClass(this.back, 'pop');
                    minimaps.forEach((minimap) => { removeClass(minimap, 'pop'); });
                    svg.thinOutLines();

                    wait(500, () => {
                        this.options.app.basemap.animate({
                            center: this.app.center,
                            zoom: this.options.app.options.interface.map.start.zoom,
                            duration: 500,
                            easing: inAndOut
                        }, () => {
                            this.destroy();
                            this.options.app.page = new Title({ app: this.app, position: 'current' });
                        });
                    })
                }
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