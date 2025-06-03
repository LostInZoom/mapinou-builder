import { addClass, makeDiv, pxToRem, wait } from "../utils/dom";
import Page from "./page";

class Title extends Page {
    constructor(app, position) {
        super(app, position);

        this.title = makeDiv(null, 'title');

        let width = pxToRem(this.container.offsetWidth);
        let name = 'Rabbitogame'
        for (let i = name.length, j = 0; i > 0; i--, j++) {
            let character = makeDiv(null, 'title-letter', name.charAt(j));
            character.style.transform = `translateX(-${width*1.1}rem)`;
            this.title.append(character);
            wait(i * 70, () => { character.style.transform = `translateX(0)`; });
        }

        this.buttons = makeDiv(null, 'button-title-container');

        this.start = makeDiv(null, 'button-title button-start');
        this.startlabel = makeDiv(null, 'button-title-label hidden', 'Start');
        this.start.append(this.startlabel);

        this.credits = makeDiv(null, 'button-title button-credits');
        this.creditslabel = makeDiv(null, 'button-title-label hidden', 'Credits');
        this.credits.append(this.creditslabel);
        
        this.buttons.append(this.start, this.credits);

        wait(500, () => { addClass(this.startlabel, 'slide'); });
        wait(1000, () => { addClass(this.creditslabel, 'slide'); });

        this.container.append(this.title, this.buttons);
    }
}

export default Title;