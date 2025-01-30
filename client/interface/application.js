import { LevelPage, StartPage } from './page.js';
import { makeDiv, addSVG, addClass, hasClass, removeClass, wait } from '../utils/dom.js';

class Application {
    constructor(params) {
        this.params = params;
        this.container = makeDiv('application', this.params.interface.theme);
        this.sliding = false;
        document.body.append(this.container);
        self = this;

        this.previous;
        this.current = new StartPage(this);
        this.next = new LevelPage(this);
        this.current.activate();


        // this.current.activate();

        // this.game;
        // this.theme = 'default';
        // this.colors = getCSSColors(this.theme);
        // this.homenode = makeDiv('home', 'menu-container');
        // this.gamenode = makeDiv('game', 'menu-container');
        // this.buttons = [];
        // this.continueButton;

        // let start = this.addButton('New Game', this.homenode);
        // start.addEventListener('click', (e) => {
        //     if (this.game !== undefined) {
        //         this.game.destroy();
        //     }
        //     this.game = new Game(this);
        //     // this.container.style.transform = 'translateX(-100%)'
            
        // })

        // this.container.append(this.homenode, this.gamenode);
    }

    getTheme() {
        if (hasClass(this.container, 'theme-dark')) { return 'theme-dark' }
        else { return 'theme-light' }
    }

    switchTheme() {
        if ( this.getTheme() === 'theme-dark' ) { this.light(); }
        else { this.dark(); }
    }

    light() {
        removeClass(this.container, 'theme-dark');
        addClass(this.container, 'theme-light');
        this.current.light();
    }

    dark() {
        removeClass(this.container, 'theme-light');
        addClass(this.container, 'theme-dark');
        this.current.dark();
    }

    setCurrent(page) {
        this.current = page;
    }

    setNext(page) {
        this.next = page;
    }

    setPrevious(page) {
        this.previous = page;
    }

    slideNext(callback) {
        this.sliding = true;
        this.current.deactivate();
        this.next.activate();

        this.setPrevious(this.current);
        this.setCurrent(this.next);

        wait(this.params.interface.transition.page, () => {
            this.sliding = false;
            callback();
        })
    }

    slidePrevious(callback) {
        this.sliding = true;
        this.current.deactivate();
        this.previous.activate();

        this.setNext(this.current);
        this.setCurrent(this.next);

        wait(this.params.interface.transition.page, () => {
            this.sliding = false;
            callback();
        })
    }





    addButton(content, start=false) {
        let b = makeDiv('', 'button-menu button', content);
        if (start) {
            this.container.insertBefore(b, this.container.firstChild)
            this.buttons.unshift(b);
        } else {
            this.container.append(b);
            this.buttons.push(b);
        }
        return b
    }

    addContinueButton() {
        if (this.continueButton === undefined) {
            let b = makeDiv('button-continue', 'button-menu button', 'Continue');
            b.addEventListener('click', (e) => {
                this.container.style.transform = 'translateX(-100%)'
            });
            this.homenode.append(b);
            this.continueButton = b;
        }
    }

    removeContinueButton() {
        if (this.continueButton !== undefined) {
            this.continueButton.remove();
            this.continueButton = undefined;
        }
    }
}

export { Application }