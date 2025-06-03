import { Content, Footer, Header } from "../interface/elements.js";
import { addClass, clearElement, makeDiv, removeClass } from "../utils/dom.js";

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
    }

    addHeader(justification='center') {
        this.header = new Header(this);
        this.header.setJustification(justification);
    }

    addContent(justification='center') {
        this.content = new Content(this);
        this.content.setJustification(justification);
    }

    addFooter(justification='center') {
        this.footer = new Footer(this);
        this.footer.setJustification(justification);
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

    clear() {
        clearElement(this.container);
    }

    destroy() {
        this.container.remove();
    }
}

export default Page;