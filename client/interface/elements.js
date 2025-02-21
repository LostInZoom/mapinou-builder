import { addClass, removeClass, makeDiv } from "../utils/dom.js";

class Element {
    constructor(page) {
        this.page = page;
        this.centering = 'center';
    }

    center() {
        removeClass(this.container, this.centering);
        addClass(this.container, 'centered');
        this.centering = 'centered';
    }

    left() {
        removeClass(this.container, this.centering);
        addClass(this.container, 'left');
        this.centering = 'left';
    }

    right() {
        removeClass(this.container, this.centering);
        addClass(this.container, 'right');
        this.centering = 'right';
    }

    append(...elements) {
        for (let i = 0; i < elements.length; i++) {
            this.container.append(elements[i]);
        }
    }
}

class Banner extends Element {
    constructor(page) {
        super(page);
        this.container = makeDiv(null, 'banner');
    }

    column() {
        addClass(this.container, 'column');
    }

    line() {
        removeClass(this.container, 'column');
    }
}

class Header extends Banner {
    constructor(page) {
        super(page);
        addClass(this.container, 'header');
        this.page.container.insertBefore(this.container, this.page.container.firstChild);
    }
}

class Footer extends Banner {
    constructor(page) {
        super(page);
        addClass(this.container, 'footer');
        this.page.container.append(this.container);
        this.column();
    }
}


class Content extends Banner {
    constructor(page) {
        super(page);
        this.container = makeDiv(null, 'content');
        this.page.container.append(this.container);
        this.center();
    }
}

export { Header, Content, Footer };