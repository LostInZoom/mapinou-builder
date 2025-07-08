import { unByKey } from 'ol/Observable.js';

import { within } from "../cartography/analysis";
import Score from "../cartography/score";
import Page from "../pages/page";
import { addClass, makeDiv, removeClass, wait } from "../utils/dom";

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

        });

        // this.phase1(() => {
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

        let hintListener = this.basemap.map.on('postrender', () => {
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
        let selectionListener = this.basemap.map.on('dblclick', (e) => {
            let target = this.basemap.map.getEventCoordinate(event);
            if (within(target, player, this.params.game.tolerance.target)) {
                unByKey(hintListener);
                unByKey(selectionListener);
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

        this.basemap.setInteractions(true);
        this.basemap.setupLevel(this.level);

        callback();
    }
}

export default Level;