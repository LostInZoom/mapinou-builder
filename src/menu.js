import Basemap from './cartography/map.js';
import Game from './game.js';
import Router from './cartography/routing.js';
import { makeDiv, addSVG, getCSSColors } from './utils/dom.js';

import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom.js';
import {
    Circle as CircleStyle,
    Fill,
    Stroke,
    Style,
} from 'ol/style.js';
import {getVectorContext} from 'ol/render.js';

import { ajaxGet } from './utils/ajax.js';
import { project } from './cartography/map.js';

function initialize() {
    let target = makeDiv('application');
    document.body.append(target);
    new Application(target);
}

class Application {
    constructor(parent) {
        this.parent = parent;
        this.theme = 'default';
        this.colors = getCSSColors(this.theme);
        this.container = makeDiv('container');
        this.loader = makeDiv('loading-container');
        this.homenode = makeDiv('home', 'menu-container');
        this.gamenode = makeDiv('game', 'menu-container');
        this.buttons = [];

        this.homebutton = makeDiv('button-home', 'button-game button');
        addSVG(this.homebutton, './src/img/home.svg');
        this.homebutton.addEventListener('click', (e) => {
            this.container.style.transform = 'translateX(0%)'
        })

        this.gamenode.append(this.loader, this.homebutton);

        let start = this.addButton('Start', this.homenode);
        start.addEventListener('click', (e) => {
            this.game = new Game(this);
            this.container.style.transform = 'translateX(-100%)'
        })

        let home = this.addButton('Tutorial', this.homenode);
        let options = this.addButton('Options', this.homenode);

        this.container.append(this.homenode, this.gamenode);
        this.parent.append(this.container);
    }

    addButton(content, parent) {
        let b = makeDiv('', 'button-menu button', content);
        parent.append(b);
        this.buttons.push(b);
        return b
    }
}

export default initialize