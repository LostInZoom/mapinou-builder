import Page from './page.js';
import { makeDiv, addSVG, addClass, hasClass, removeClass, wait } from '../utils/dom.js';
import { GameMap, MenuMap } from '../cartography/map.js';

class Application {
    constructor(params) {
        this.params = params;

        // Create the DOM Element
        this.container = makeDiv('application', 'application ' + this.params.interface.theme);
        document.body.append(this.container);

        // Boolean to flag if the page is sliding
        this.sliding = false;
        
        // Storage fot the previous page
        this.previous = new Page(this, 'previous');

        // Create the current page
        this.current = new Page(this, 'current');

        // Create the next page
        this.next = new Page(this, 'next');

        this.page1(this.current);




        // this.next = new LevelPage(this);
        


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

    page1(page) {
        let title = makeDiv(null, 'title', 'Cartogame');
        let startButton = makeDiv('button-start', 'button-menu button ' + this.params.interface.theme, 'Play');
        page.container.append(title, startButton);

        let themeButton = makeDiv('button-theme', 'button', null);
        addSVG(themeButton, new URL('../img/theme.svg', import.meta.url));
        themeButton.addEventListener('click', () => { this.switchTheme(); });
        page.container.append(themeButton);
        page.themed.push(startButton);

        startButton.addEventListener('click', () => {
            this.page2(this.next);
            if (!this.sliding) {
                this.slideNext(() => {
                    this.next = new Page(this, 'next');
                });
            }
        });
    }

    page2(page) {
        let backButton = makeDiv('button-previous', 'button-menu button ' + this.params.interface.theme, 'Menu');
        page.container.append(backButton);
        page.themed.push(backButton);

        let themeButton = makeDiv('button-theme', 'button', null);
        addSVG(themeButton, new URL('../img/theme.svg', import.meta.url));
        themeButton.addEventListener('click', () => { this.switchTheme(); });
        page.container.append(themeButton);       

        let tutorialButton = makeDiv(null, 'button-level button-menu button ' + this.params.interface.theme, 'Tutorial');
        page.container.append(tutorialButton);
        page.themed.push(tutorialButton);

        let levelcontainer = makeDiv(null, 'level-selection');
        page.container.append(levelcontainer);

        let levels = this.params.levels;
        for (let i = 0; i < levels.length; i++) {
            let levelbutton = makeDiv(null, 'button-level button-menu button ' + this.params.interface.theme, levels[i]);
            levelcontainer.append(levelbutton);
            page.themed.push(levelbutton);
        }

        tutorialButton.addEventListener('click', () => {
            this.tutorial(this.next);
            if (!this.sliding) {
                this.slideNext(() => {
                    this.next = new Page(this, 'next');
                });
            }
        });

        backButton.addEventListener('click', () => {
            this.page1(this.previous);
            if (!this.sliding) {
                this.slidePrevious(() => {
                    this.previous = new Page(this, 'previous');
                });
            }
        });
    }

    tutorial(page) {
        addClass(page.container, 'tutorial');
        
        let menumap = new MenuMap(page);
        menumap.setCenter(this.params.tutorial.player);
        menumap.setZoom(16);
        menumap.setGeometry('player', this.params.tutorial.player);

        let information = makeDiv(null, 'tutorial-information');
        let title = makeDiv(null, 'tutorial-title', 'Phase 1');

        let text = makeDiv(null, 'tutorial-text', `
            You must find your location on the map
            following the information on screen.<br><br>
            Hints are updated during the search if you
            are heading in the right direction.<br><br>
            Double tap on the screen when you have found the location,
            a visual let you know if you're wrong.
            `)

        let continueButton = makeDiv(null, 'button-menu button ' + this.params.interface.theme, 'Alright');
        information.append(title, text, continueButton);
        page.container.append(information);

        continueButton.addEventListener('click', () => {
            this.phase1(this.next);
            if (!this.sliding) {
                this.slideNext(() => {
                    this.next = new Page(this, 'next');
                });
            }
        });
    }

    phase1(page) {
        let gamemap = new GameMap(page);
        gamemap.setCenter(this.params.tutorial.start.center);
        gamemap.setZoom(this.params.tutorial.start.zoom);
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
        this.previous.light();
        this.current.light();
        this.next.light();
        this.params.interface.theme = 'theme-light';
    }

    dark() {
        removeClass(this.container, 'theme-light');
        addClass(this.container, 'theme-dark');
        this.previous.dark();
        this.current.dark();
        this.next.dark();
        this.params.interface.theme = 'theme-dark';
    }

    slideNext(callback) {
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