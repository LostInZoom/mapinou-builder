import { Basemap } from "../cartography/map";
import { addClass, addClassList, makeDiv, pxToRem, wait } from "../utils/dom";
import Page from "./page";

function easeIn(x) {
    return 1 - Math.pow(1 - x, 3);
}

function remap(value, xmin, xmax, dmin=0, dmax=1) {
    return dmin + ((value - xmin) / (xmax - xmin)) * (dmax - dmin);
}

class Title extends Page {
    constructor(app, position) {
        super(app, position);

        this.basemap = new Basemap({
            page: this,
            class: 'map-title',
            center: [ 291041.84, 5629996.16 ],
            zoom: 15
        }, () => {
            addClass(this.container, 'page-title');

            this.titlemask = makeDiv(null, 'title-decoration');
            let necorner = makeDiv(null, 'title-corner north east');
            let secorner = makeDiv(null, 'title-corner south east');
            let swcorner = makeDiv(null, 'title-corner south west');
            let nwcorner = makeDiv(null, 'title-corner north west');

            let nborder = makeDiv(null, 'title-border parallel north');
            let sborder = makeDiv(null, 'title-border parallel south');
            let eborder = makeDiv(null, 'title-border meridian east');
            let wborder = makeDiv(null, 'title-border meridian west');

            this.titlemask.append(
                necorner, secorner, swcorner, nwcorner,
                nborder, sborder, eborder, wborder
            );

            this.container.append(this.titlemask);

            this.title = makeDiv(null, 'title-name');
            this.letters = makeDiv(null, 'title-letters');
            this.title.append(this.letters);

            let delay = 100;
            wait(delay, () => { addClassList([ nborder, sborder, eborder, wborder ], 'slide'); });

            delay += 200;
            wait(delay, () => { addClassList([ necorner, secorner, swcorner, nwcorner ], 'slide'); });

            delay += 200;
            wait(delay, () => { addClass(this.title, 'slide'); })
            
            this.name = 'Cartogame'

            let animationtime = 200;
            
            let lettertime = animationtime / this.name.length;
            let width = pxToRem(this.container.offsetWidth);
            
            delay += 300;
            for (let i = (this.name.length - 1), j = 0; i >= 0; i--, j++) {
                let character = makeDiv(null, 'title-letter', this.name.charAt(j));
                character.style.transform = `translateX(-${width*1.1}rem)`;
                this.letters.append(character);
                let remapped = remap(i * lettertime, 0, animationtime);
                wait(easeIn(remapped) * animationtime + delay, () => {
                    character.style.transform = `translateX(0)`;
                });
            }

            delay += 300 + animationtime;

            wait(delay, () => {
                addClass(this.letters, 'bounce');
            })

            delay += 400;
            this.buttons = makeDiv(null, 'button-title-container');

            this.start = makeDiv(null, 'button-title button-start');
            this.startlabel = makeDiv(null, 'button-title-label hidden', 'Play');
            this.start.append(this.startlabel);

            this.credits = makeDiv(null, 'button-title button-credits');
            this.creditslabel = makeDiv(null, 'button-title-label hidden', 'Credits');
            this.credits.append(this.creditslabel);
            this.buttons.append(this.start, this.credits);

            this.bottomcredits = makeDiv(null, 'title-credits', `LostInZoom - ${new Date().getFullYear()}`);

            wait(delay, () => { addClass(this.startlabel, 'slide'); });
            wait(delay + 300, () => { addClass(this.creditslabel, 'slide'); });
            wait(delay + 1000, () => { addClass(this.bottomcredits, 'slide'); });

            this.container.append(this.title, this.buttons, this.bottomcredits);
        });
    }
}

export default Title;