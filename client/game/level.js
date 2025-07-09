import { unByKey } from 'ol/Observable.js';

import { within } from "../cartography/analysis";
import Score from "../cartography/score";
import Page from "../pages/page";
import { addClass, makeDiv, removeClass, wait } from "../utils/dom";
import { inAndOut } from 'ol/easing';

class Level extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.params = this.options.app.options;
        this.level = this.options.params;
        this.basemap = this.options.app.basemap;

        this.score = new Score({
            parent: this.options.app.header,
            increment: this.params.game.score.increment.default,
            refresh: this.params.game.score.refresh.default,
            state: 'default'
        });
        this.score.pop();
        this.score.start();

        this.back = makeDiv(null, 'header-button left', this.params.svgs.cross);
        this.options.app.header.insert(this.back);

        this.back.offsetWidth;
        addClass(this.back, 'pop');

        // Cancel current game and go back to level selection
        this.back.addEventListener('click', () => {
            this.basemap.removeListeners();
            switch (this.phase) {
                case 1: {
                    break;
                }
                case 2: {
                    break;
                }
                default: {
                    break;
                }
            }
        });

        // this.phase1(() => {
        //     this.basemap.setInteractions(false);
        //     this.phase2(() => {
        //         console.log('nice');
        //     });
        // });

        this.phase2(() => {
            console.log('nice');
        });
    }

    phase1(callback) {
        callback = callback || function() {};
        this.phase = 1;

        this.hints = this.level.hints;

        this.hint = makeDiv(null, 'level-hint-container');
        this.hintext = makeDiv(null, 'level-hint');
        this.hint.append(this.hintext);
        this.container.append(this.hint);
        this.hint.offsetHeight;

        this.basemap.setInteractions(true);

        let player = this.level.player;

        this.hintListener = this.basemap.map.on('postrender', () => {
            let visible = this.basemap.isVisible(player);
            let zoom = this.basemap.view.getZoom();
            for (let [m, h] of Object.entries(this.hints)) {
                if (!visible) {
                    let t = this.params.game.lost;
                    this.hintext.innerHTML = t;
                } else {
                    if (zoom >= m) {
                        addClass(this.hint, 'pop');
                        this.hintext.innerHTML = h;
                    }
                }
            }
        });

        this.basemap.map.render();

        let activeWrong = false;
        this.selectionListener = this.basemap.map.on('dblclick', (e) => {
            let target = this.basemap.map.getEventCoordinate(event);
            if (within(target, player, this.params.game.tolerance.target)) {
                unByKey(this.hintListener);
                unByKey(this.selectionListener);
                removeClass(this.hint, 'pop');
                wait(300, () => { this.hint.remove(); })
                callback();
            } else {
                if (!activeWrong) {
                    activeWrong = true;
                    addClass(this.basemap.container, 'wrong');
                    wait(500, () => {
                        removeClass(this.basemap.container, 'wrong');
                        activeWrong = false;
                    })
                }
            }
        });
    }

    phase2(callback) {
        callback = callback || function() {};
        this.phase = 2;
        this.basemap.createCharacters(this, this.level);

        this.basemap.player.spawn(() => {
            let extent = this.basemap.getExtentForData();
            this.basemap.fit(extent, {
                duration: 500,
                easing: inAndOut,
                padding: [ 100, 20, 20, 20 ]
            }, () => {
                this.basemap.target.spawn(() => {
                    let enemies = this.basemap.enemies.getEnemies();
                    
                    
                    this.basemap.setInteractions(true);
                    this.basemap.activateMovement();
                });
            })
        });

        
    }
}

export default Level;