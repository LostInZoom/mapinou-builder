import { addClass, makeDiv, hasClass, addClass, removeClass, wait } from "../utils/dom";
import Consent from "./consent";
import Page from "./page";
import Title from "./title";

class Levels extends Page {
    constructor(options, callback) {
        super(options, callback);

        this.state = {
            type: 'level',
            position: 8
        }

        addClass(this.container, 'page-levels');

        this.content = makeDiv(null, 'page-content');
        this.back = makeDiv(null, 'page-button page-button-back', 'Menu principal');
        this.text = makeDiv(null, 'levels-text');
        this.hint = makeDiv(null, 'levels-text-hint',
            `Les niveaux se débloquent dans l'ordre.<br>
            Commencez par faire le tutoriel avant de progresser.`
        );

        this.text.append(this.hint);

        this.content.append(this.back, this.text);
        this.container.append(this.content);

        this.levels = [];
        this.tutorial = makeDiv(null, 'levels-test-button levels-button done', 'Tutoriel');
        this.tiers = makeDiv(null, 'levels-tiers');

        this.container.append(this.content, this.tutorial, this.tiers);

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
                if (this.state.type === 'level' && this.state.position === levelnumber) {
                    addClass(level, 'active');
                    className = 'disabled';
                } else {
                    addClass(level, className);
                }
                tierlist.push(level);
                ++levelnumber;

                wait(delay, () => { addClass(level, 'pop'); });
                delay += 50;
            } else {
                let tier = makeDiv(null, 'levels-tier');
                tierlist.forEach((lvl) => { tier.append(lvl); });
                this.tiers.append(tier);
                tierlist = [];
                
                let test = makeDiv(null, 'levels-test-button levels-button', l.name);
                this.tiers.append(test);

                if (this.state.type === 'test' && this.state.position === l.name) {
                    addClass(test, 'active');
                    className = 'disabled';
                } else {
                    addClass(test, className);
                }

                delay += 200;
                wait(delay, () => { addClass(test, 'pop'); });
                delay += 250;
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