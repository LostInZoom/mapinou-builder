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
        
        // Storage fot the previous page
        this.previous = new Page(this, 'previous');
        // Create the current page
        this.current = new Title(this, 'current');
        // Create the next page
        this.next = new Page(this, 'next');

        this.done = 0;
        this.tutodone = true;

        // this.phase2(this.current);
        // this.title(this.current);
    }

    slideNext(callback) {
        if (!this.sliding) {
            this.sliding = true;

            this.next.setCurrent();
            this.current.setPrevious();

            this.previous = this.current;
            this.current = this.next;

            wait(this.params.interface.transition.page, () => {
                this.previous.clear();
                this.container.firstChild.remove();
                this.sliding = false;
                callback();
            })
        }
    }

    slidePrevious(callback) {
        this.sliding = true;

        this.previous.setCurrent();
        this.current.setNext();
        
        this.next = this.current;
        this.current = this.previous;

        wait(this.params.interface.transition.page, () => {
            this.next.clear();
            this.container.lastChild.remove();
            this.sliding = false;
            callback();
        })
    }
}

export default Application;