import Tutorial from "../game/tutorial";
import { addClass, makeDiv, addClass, removeClass, wait } from "../utils/dom";
import Page from "./page";
import Title from "./title";
import { easeInOutSine } from '../utils/math.js';
import { ExperiencePanel, NavigationBar, TierPanel } from "./tiers.js";

class Levels extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.listen = false;
        this.init = options.init ?? true;
        this.update = options.update ?? false;

        this.app.forbidRabbits();
        addClass(this.container, 'page-levels');
        this.levels = this.app.options.levels;

        this.progression = this.app.progression;
        // DEBUGGING
        this.progression = { tier: 3, level: 3 };

        this.position = this.progression.tier;
        this.level = this.progression.level;

        this.current = this.createTier({
            type: this.getTier().type,
            position: 'current',
            animate: this.init
        }, () => { this.listen = true; });
        this.navigation = new NavigationBar({ page: this });

        // Create the back button to get back to the title screen
        this.back = makeDiv(null, 'header-button left', this.params.svgs.arrowleft);
        this.app.header.insert(this.back);
        this.back.offsetHeight;
        addClass(this.back, 'pop');
        this.back.addEventListener('click', () => {
            if (this.listen) {
                this.listen = false;
                this.hide(() => {
                    this.destroy();
                    this.options.app.basemap.fly({
                        center: this.app.center,
                        zoom: this.params.interface.map.start.zoom,
                        duration: 500,
                        easing: easeInOutSine
                    }, () => {
                        this.app.page = new Title({ app: this.app, position: 'current' });
                    });
                });
            }
        });
    }

    hide(callback) {
        removeClass(this.back, 'pop');
        this.navigation.hide();
        this.current.hide();
        wait(500, () => {
            this.back.remove();
            callback();
        });
    }

    listening() {
        return this.listen;
    }

    getProgression() {
        return this.progression;
    }

    getNumber() {
        return this.levels.length;
    }

    getPosition() {
        return this.position;
    }

    getTier() {
        return this.levels[this.position];
    }

    slide(direction) {
        if (this.listen) {
            // Flag to know direction
            const isPrevious = direction === 'previous';

            // Return if we're at the first or last position (shouldn't be reached as buttons shouldn't be available)
            if (isPrevious && this.position === 0) { return; }
            else if (!isPrevious && this.position >= this.levels.length - 1) { return; }

            this.listen = false;

            if (this.current.getType() === 'tier') {
                this.current.loading();
                this.current.unobserveSize();
            }

            this.position = isPrevious ? this.position - 1 : this.position + 1;
            const obj = this.createTier({
                type: this.getTier().type,
                position: direction,
                animate: false
            });
            obj.slideIn();

            this.navigation.slide(direction);
            this.current.slideOut(isPrevious ? 'next' : 'previous', () => {
                this.current.destroy();
                this.current = obj;
                this.listen = true;
            });
        }
    }

    createTier(options, callback) {
        callback = callback || function () { };
        if (options.type === 'tier') {
            return new TierPanel({
                page: this,
                tier: this.position,
                level: this.level,
                animate: options.animate,
                position: options.position
            }, callback);
        }
        else if (options.type === 'test') {
            return new ExperiencePanel({
                page: this,
                number: this.position,
                animate: options.animate,
                position: options.position
            }, callback);
        }
        else if (options.type === 'tutorial') {

        }
    }
}

export default Levels;