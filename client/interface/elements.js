import { addClass, removeClass, makeDiv } from "../utils/dom.js";

class Element {
    constructor(parent) {
        this.parent = parent;
        this.justifications = ['center', 'left', 'right']
        this.justification = 'center';
    }

    setJustification(justification) {
        if (this.justifications.includes(justification)) {
            removeClass(this.container, this.centering);
            addClass(this.container, justification);
            this.justification = justification;
        }
    }

    append(...elements) {
        for (let i = 0; i < elements.length; i++) {
            this.container.append(elements[i]);
        }
    }
}

class Banner extends Element {
    constructor(parent) {
        super(parent);
        this.container = makeDiv(null, 'banner');
        this.directions = ['row', 'column']
        this.direction = 'row';
    }

    setDirection(direction) {
        if (this.directions.includes(direction)) {
            removeClass(this.container, this.direction);
            addClass(this.container, direction);
            this.direction = direction;
        }
    }
}

class Header extends Banner {
    constructor(parent) {
        super(parent);
        addClass(this.container, 'header');
        this.parent.container.insertBefore(this.container, this.parent.container.firstChild);
    }
}

class Footer extends Banner {
    constructor(parent) {
        super(parent);
        addClass(this.container, 'footer');
        this.parent.container.append(this.container);
        this.setDirection('column');
    }
}

class Content extends Element {
    constructor(parent) {
        super(parent);
        this.container = makeDiv(null, 'page-element content');
        if (this.parent.footer) {
            this.parent.container.insertBefore(this.container, this.footer.container);
        } else {
            this.parent.container.append(this.container);
        }
    }
}

export { Header, Content, Footer };