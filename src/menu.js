import Basemap from './map.js';
import { makeElement } from './utils/dom.js';

function initialize() {
    let target = makeElement('', '', 'application');
    document.body.append(target);

    let application = new Application(target);
}

class Application {
    constructor(parent) {
        this.parent = parent;
        this.container = makeElement('', '', 'container');
        this.home = makeElement('menu-container', '', 'home');
        this.game = makeElement('menu-container', '', 'game');
        this.buttons = [];

        this.homebutton = makeElement('button-home button-game button', "<object type='image/svg+xml' data='./src/img/home.svg' class='button-home'>home</object>");
        
        // `<img src='./src/img/home.svg' />`);
        
        this.game.append(this.homebutton);

        this.#addButton('Start', this.home, this.play);
        this.#addButton('Options', this.home);

        this.container.append(this.home, this.game);
        this.parent.append(this.container);

        this.#addMap(this.game);
    }

    play(e) {
        e.target.parentNode.parentNode.style.transform = 'translateX(-100%)'
    }

    #addButton(content, parent, listener) {
        let b = makeElement('button-menu button', content);
        
        if (typeof listener !== 'undefined') {
            b.addEventListener('click', listener);
        }
        
        parent.append(b);
        this.buttons.push(b);
    }

    #addMap(parent) {
        let basemap = new Basemap(parent);
    }
}

export default initialize