import Game from './game.js';
import { makeDiv, addSVG, getCSSColors } from './utils/dom.js';

function initialize() {
    let target = makeDiv('application');
    document.body.append(target);
    new Application(target);
}

class Application {
    constructor(parent) {
        this.parent = parent;
        this.game;
        this.theme = 'default';
        this.colors = getCSSColors(this.theme);
        this.container = makeDiv('container');
        this.homenode = makeDiv('home', 'menu-container');
        this.gamenode = makeDiv('game', 'menu-container');
        this.buttons = [];
        this.continueButton;

        let start = this.addButton('New Game', this.homenode);
        start.addEventListener('click', (e) => {
            if (this.game !== undefined) {
                this.game.destroy();
            }
            this.game = new Game(this);
            this.container.style.transform = 'translateX(-100%)'
           
        })

        // let home = this.addButton('Tutorial', this.homenode);
        // let options = this.addButton('Options', this.homenode);

        this.container.append(this.homenode, this.gamenode);
        this.parent.append(this.container);
    }

    addButton(content, parent, start=false) {
        let b = makeDiv('', 'button-menu button', content);
        if (start) {
            parent.insertBefore(b, parent.firstChild)
            this.buttons.unshift(b);
        } else {
            parent.append(b);
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

export default initialize