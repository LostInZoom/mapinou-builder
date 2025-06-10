import { Content, Footer, Header } from "../interface/elements.js";
import { addClass, clearElement, makeDiv, removeClass } from "../utils/dom.js";

class Page {
    constructor(options) {
        this.options = options || {};

        this.app = this.options.app;
        this.position = this.options.position;

        // Create DOM Element
        this.container = makeDiv(null, 'page ' + this.position);
        this.app.container.append(this.container);

        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;
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

    setPosition(position) {
        ['previous', 'current', 'next'].forEach((p) => { removeClass(this.container, p); })
        addClass(this.container, position);
    }

    slidePrevious() {
        this.app.slidePrevious(() => {
            this.app.previous = new Page(this, 'previous');
        });
    }

    slideNext() {
        this.app.slideNext(() => {
            this.app.next = new Page(this, 'next');
        });
    }

    clear() {
        clearElement(this.container);
    }

    destroy() {
        this.container.remove();
    }
}

export default Page;