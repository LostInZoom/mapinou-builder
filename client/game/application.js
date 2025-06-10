import Page from '../pages/page.js';
import { makeDiv, addSVG, addClass, hasClass, removeClass, wait } from '../utils/dom.js';
import Title from '../pages/title.js';

class Application {
    constructor(options) {
        this.options = options;

        // Create the DOM Element
        this.container = makeDiv('application', null);
        document.body.append(this.container);

        // Boolean to flag if the page is sliding
        this.sliding = false;

        // Create the current page
        this.current = new Title({
            app: this,
            position: 'current'
        });
    }

    slide(position, page, callback) {
        if (!this.sliding) {
            this.sliding = true;
            this.current.setPosition(position);
            page.setPosition('current');
            wait(this.options.interface.transition.page, () => {
                this.current.destroy();
                this.current = page;
                this.sliding = false;
                callback();
            })
        }
    }
}

export default Application;