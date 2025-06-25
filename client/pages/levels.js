import Tutorial from "../game/tutorial";
import { addClass, makeDiv, hasClass, addClass, removeClass, wait } from "../utils/dom";
import Consent from "./consent";
import Page from "./page";
import Title from "./title";

class Levels extends Page {
    constructor(options, callback) {
        super(options, callback);

        // this.options.app.loading();
        this.options.app.basemap.fit(this.options.app.options.interface.map.extent);












        this.app.options.state = {
            type: 'level',
            position: 1
        }

        this.back = makeDiv(null, 'page-button header-button-back', 'Retour');

        addClass(this.container, 'page-levels');

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

        this.container.append(this.back);

        let delay = this.app.options.interface.transition.page;

        wait(delay, () => {
            addClass(this.back, 'pop');
            addClass(this.tutorial, 'pop');
        });

        delay += 250;

        let tierlist = [];
        let levelnumber = 1;
        let className = 'done';

        for (let i = 0; i < this.app.options.levels.length; i++) {
            let l = this.app.options.levels[i];
            if (l.type === 'level') {
                let level = makeDiv(null, 'levels-tier-button levels-button', levelnumber);
                if (this.app.options.state.type === 'level' && this.app.options.state.position === levelnumber) {
                    addClass(level, 'active');
                    className = 'disabled';
                } else {
                    addClass(level, className);
                }
                tierlist.push(level);
                ++levelnumber;

                wait(delay, () => { addClass(level, 'pop'); });
                delay += 50;

                level.addEventListener('click', () => {
                    if (hasClass(level, 'active')) {
                        // Start new level
                    };
                });
            } else {
                let tier = makeDiv(null, 'levels-tier');
                tierlist.forEach((lvl) => { tier.append(lvl); });
                this.tiers.append(tier);
                tierlist = [];
                
                let test = makeDiv(null, 'levels-test-button levels-button', l.name);
                this.tiers.append(test);

                if (this.app.options.state.type === 'test' && this.app.options.state.position === l.name) {
                    addClass(test, 'active');
                    className = 'disabled';
                } else {
                    addClass(test, className);
                }

                delay += 200;
                wait(delay, () => { addClass(test, 'pop'); });
                delay += 250;

                test.addEventListener('click', () => {
                    if (hasClass(test, 'active')) {
                        // Start new expérience
                    };
                });
            }
        }

        if (tierlist.length > 0) {
            let tier = makeDiv(null, 'levels-tier');
            tierlist.forEach((lvl) => { tier.append(lvl); });
            this.tiers.append(tier);
        }

        wait(delay, this.callback);
    
        this.back.addEventListener('click', () => {
            this.previous = new Title({
                app: this.app,
                position: 'previous',
            });
            this.app.slide('next', this.previous);
        });
    }
}

export default Levels;