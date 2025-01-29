import { addClass, addSVG, makeDiv, removeClass, wait } from "../utils/dom.js";

class Page {
    constructor(app) {
        this.app = app;
        this.container = makeDiv(null, 'page inactive theme-light');
        this.app.container.append(this.container);
    }

    button(i, c, content) {
        let button = makeDiv(i, c, content);
        this.container.append(button);
        return button;
    }

    activate() {
        removeClass(this.container, 'inactive');
        addClass(this.container, 'active');
    }

    deactivate() {
        removeClass(this.container, 'active');
        addClass(this.container, 'inactive');
    }

    light() {
        removeClass(this.container, 'theme-dark');
        addClass(this.container, 'theme-light');
    }

    dark() {
        removeClass(this.container, 'theme-light');
        addClass(this.container, 'theme-dark');
    }
}

class StartPage extends Page {
    constructor(app) {
        super(app);
        this.theme = this.button('button-theme', 'button');
        addSVG(this.theme, new URL('../img/theme.svg', import.meta.url));

        this.title = makeDiv(null, 'title', 'Cartogame');
        this.container.append(this.title);
        this.start = this.button('button-start', 'button-menu button', 'Play');
        this.activate();
        
        this.next = new LevelPage(this.app);

        self = this;

        function theme() { self.app.switchTheme(); }
        
        function slide() {
            self.start.removeEventListener('click', slide);
            self.deactivate();
            self.next.activate();
            self.app.page = self.next;
        }
        this.theme.addEventListener('click', theme);
        this.start.addEventListener('click', slide);
    }
}

class LevelPage extends Page {
    constructor(app) {
        super(app);
        this.previous = this.button('button-previous', 'button-menu button', 'Main menu');

        self = this;
        function slide() {
            self.previous.removeEventListener('click', slide);
            self.deactivate();
        }
        this.previous.addEventListener('click', slide);
    }
}

export default { Page };
export { StartPage };