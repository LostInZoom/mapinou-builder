import { addClass, addSVG, clearElement, makeDiv, removeClass, wait } from "../utils/dom.js";

class Page {
    constructor(app, position) {
        this.app = app;

        // Create DOM Element
        this.container = makeDiv(null, 'page ' + position);
        // Add the element to the start or the end depending on the position
        if (position === 'previous' && this.app.container.children.length > 0) {
            this.app.container.insertBefore(this.container, this.app.container.firstChild);
        }
        else { this.app.container.append(this.container); }

        // Storage for elements to style when changing theme
        this.themed = [];
    }

    setPrevious() {
        removeClass(this.container, 'next');
        removeClass(this.container, 'current');
        addClass(this.container, 'previous');
    }

    setCurrent() {
        removeClass(this.container, 'previous');
        removeClass(this.container, 'next');
        addClass(this.container, 'current');
    }

    setNext() {
        removeClass(this.container, 'previous');
        removeClass(this.container, 'current');
        addClass(this.container, 'next');
    }

    light() {
        for (let i = 0; i < this.themed.length; i++) {
            removeClass(this.themed[i], 'theme-dark');
            addClass(this.themed[i], 'theme-light');
        }
    }

    dark() {
        for (let i = 0; i < this.themed.length; i++) {
            removeClass(this.themed[i], 'theme-light');
            addClass(this.themed[i], 'theme-dark');
        }
    }

    clear() {
        clearElement(this.container);
    }

    destroy() {
        this.container.remove();
    }

    getTheme() {
        return this.app.getTheme();
    }
}

export default Page;