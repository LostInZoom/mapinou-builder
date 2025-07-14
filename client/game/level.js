import { unByKey } from 'ol/Observable.js';

import { middle, within } from "../cartography/analysis";
import Score from "../cartography/score";
import Page from "../pages/page";
import { addClass, makeDiv, removeClass, wait } from "../utils/dom";
import { inAndOut } from 'ol/easing';
import { Enemy } from '../characters/enemies';
import Target from '../characters/target';
import Player from '../characters/player';
import Levels from '../pages/levels';

class Level extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.params = this.options.app.options;
        this.level = this.options.params;
        this.levels = this.options.levels;
        this.basemap = this.options.app.basemap;

        this.score = new Score({
            level: this,
            parent: this.options.app.header,
            state: 'stopped'
        });

        this.back = makeDiv(null, 'header-button left', this.params.svgs.cross);
        this.options.app.header.insert(this.back);
        this.back.offsetWidth;
        addClass(this.back, 'pop');

        // Cancel current game and go back to level selection
        this.listening = false;
        this.back.addEventListener('click', () => {
            if (this.listening) { this.clear('abort'); }
        });

        // this.phase1(() => {
        //     this.phase2(() => {
        //         this.clear('win');
        //     });
        // });

        this.phase2(() => {
            this.ending(() => {
                this.clear('won');
            });
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

        this.listening = true;
    }

    phase2(callback) {
        callback = callback || function() {};
        this.phase = 2;
        this.basemap.setInteractions(false);
        this.basemap.createCharacters(this, this.level);

        this.canceler = makeDiv(null, 'level-cancel-button', this.params.svgs.helm);
        this.container.append(this.canceler);

        this.canceler.addEventListener('click', () => {
            if (this.player.traveling) { this.player.stop(); }
        });

        this.basemap.player.spawn(() => {
            this.dataExtent = this.basemap.getExtentForData();

            this.basemap.fit(this.dataExtent, {
                duration: 500,
                easing: inAndOut,
                padding: [ 100, 50, 50, 50 ]
            }, () => {
                this.basemap.target.spawn(() => {
                    this.basemap.enemies.spawn(1000, () => {
                        this.listening = true;
                        this.score.pop();
                        this.score.setState('default');
                        this.score.start();
                        this.basemap.setInteractions(true);

                        this.basemap.activateMovement(win => {
                            // Here, the level has been won
                            if (win) {
                                this.basemap.setInteractions(false);
                                callback();
                            }
                        });
                    });
                });
            })
        });
    }

    ending(callback) {
        callback = callback || function() {};
        this.score.stop()
        let score = this.score.get();
        this.score.unpop(() => { this.score.destroy(); });

        this.basemap.fit(this.dataExtent, {
            duration: 500,
            easing: inAndOut,
            padding: [ 100, 50, 50, 50 ]
        }, () => {
            
        });
    }

    routing() {
        if (this.canceler) {
            removeClass(this.canceler, 'moving');
            addClass(this.canceler, 'routing');
        }
    }

    moving() {
        if (this.canceler) {
            removeClass(this.canceler, 'routing');
            addClass(this.canceler, 'moving');
        }
    }

    activateMovementButton() {
        if (this.canceler) {
            addClass(this.canceler, 'active');
        }
    }

    deactivateMovementButton() {
        if (this.canceler) {
            removeClass(this.canceler, 'moving');
            removeClass(this.canceler, 'routing');
            removeClass(this.canceler, 'active');
        }
    }

    clear(state) {
        removeClass(this.back, 'pop');
        this.basemap.setInteractions(false);
        this.basemap.removeListeners();

        const clearing = 4;
        let cleared = 0;

        wait(300, () => {
            this.back.remove();
            if (++cleared === clearing) { this.toLevels(); }
        });
        this.basemap.clear(() => {
            this.basemap.removeLayers();
            if (++cleared === clearing) { this.toLevels(); }
        });
        this.score.destroy(() => {
            if (++cleared === clearing) { this.toLevels();}
        });
        this.basemap.makeUnroutable(() => {
            if (++cleared === clearing) { this.toLevels(); }
        });
    }

    toLevels() {
        this.destroy();
        this.app.page = new Levels({
            app: this.app,
            position: 'current',
            init: true
        });
    }
}

export default Level;