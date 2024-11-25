import Basemap from './map.js';
import { makeDiv, addSVG } from './utils/dom.js';

function initialize() {
    let target = makeDiv('application');
    document.body.append(target);

    let application = new Application(target);
}

class Application {
    constructor(parent) {
        this.parent = parent;
        this.container = makeDiv('container');
        this.home = makeDiv('home', 'menu-container');
        this.game = makeDiv('game', 'menu-container');
        this.buttons = [];

        this.homebutton = makeDiv('button-home', 'button-game button');
        addSVG(this.homebutton, './src/img/home.svg');
        this.homebutton.addEventListener('click', this.menu);

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

    menu(e) {
        e.target.parentNode.parentNode.style.transform = 'translateX(0%)'
    }

    #addButton(content, parent, listener) {
        let b = makeDiv('', 'button-menu button', content);
        
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