import { addClass, addSVG, makeDiv, removeClass, wait } from "../utils/dom.js";

class Page {
    constructor(app) {
        this.app = app;
        this.container = makeDiv(null, 'page inactive theme-light');
        this.app.container.append(this.container);
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

    destroy() {
        this.container.remove();
    }
}

class StartPage extends Page {
    constructor(app) {
        super(app);
        self = this;
        this.theming()
        
        this.title = makeDiv(null, 'title', 'Cartogame');
        this.startButton = makeDiv('button-start', 'button-menu button', 'Play');
        this.container.append(this.title, this.startButton);

        this.startButton.addEventListener('click', () => {
            if (!this.app.sliding) {
                this.app.slideNext(() => {
                
                });
            }
        });
    }

    theming() {
        this.themeButton = makeDiv('button-theme', 'button', null);
        addSVG(this.themeButton, new URL('../img/theme.svg', import.meta.url));
        this.themeButton.addEventListener('click', () => { self.app.switchTheme(); });
        this.container.append(this.themeButton);
    }
}

class LevelPage extends Page {
    constructor(app) {
        super(app);
        self = this;

        this.backButton = makeDiv('button-previous', 'button-menu button', 'Menu');
        this.container.append(this.backButton);

        this.backButton.addEventListener('click', () => {
            if (!this.app.sliding) {
                this.app.slidePrevious(() => {
                
                });
            }
        });
    }
}

export default { Page };
export { Page, StartPage, LevelPage };