import { addClass, makeDiv, removeClass, wait } from "../utils/dom";
import { remap, easeOutCubic, easeInCubic, easeOutSine } from "../utils/math";
import { pxToRem } from "../utils/parse";
import Consent from "./consent";
import Page from "./page";

class Title extends Page {
    constructor(options, callback) {
        super(options, callback);

        addClass(this.container, 'page-title');

        // Create the title div and the container for the individual letters
        this.title = makeDiv(null, 'title-name');
        this.letters = makeDiv(null, 'title-letters');
        this.title.append(this.letters);

        let delay = this.app.options.interface.transition.page;
        wait(delay, () => { addClass(this.letters, 'pop'); })
        
        // Add a delay of 300 milliseconds to make sure the title background is revealed
        delay += 300;
        
        // Set the title name
        this.name = 'Mapinou';
        this.container.append(this.title);

        this.letterArray = [];
        
        // Loop through the name to get individual letters
        for (let i = 0; i < this.name.length; i++) {
            // Create the letter element translated by the width of the page * 1.1
            let value = this.name.charAt(i);

            let character = makeDiv(null, 'title-letter', value);
            if (value.trim().length === 0) { addClass(character, 'empty'); };

            this.letters.append(character);
            this.letterArray.push(character);
        }

        // Get the width of the page in rem
        let width = pxToRem(this.title.offsetWidth);

        // Set the time taken by the letters animation
        let animationtime = width * 10;
        // Calculate individual letters animation time
        let lettertime = animationtime / this.name.length;

        let j = this.letterArray.length - 1;
        this.letterArray.forEach((l) => {
            l.style.transform = `translateX(-${width}rem)`;
            // Remap the delay, from [0, animationtime] to [0, 1]
            let remapped = remap(j * lettertime, 0, animationtime);
            // Calculate the remapped easing
            let easing = remap(easeOutCubic(remapped), 0, 1, 0, animationtime);
            // Wait the easing value for each letter before the translation
            wait(easing + delay, () => {
                l.style.opacity = 1;
                l.style.transform = `translateX(0)`;
            });
            j--;
        })

        // Increment the delay by the letters animation time
        delay += 400 + animationtime;
        // Bounce the whole title letters and add the time of the animation to the delay
        wait(delay, () => { addClass(this.letters, 'bounce'); })

        // Create the start and credits buttons
        this.buttons = makeDiv(null, 'title-buttons');

        this.start = makeDiv(null, 'title-button title-button-start');
        this.startlabel = makeDiv(null, 'title-button-label', 'Jouer');
        this.start.append(this.startlabel);

        this.credits = makeDiv(null, 'title-button title-button-credits');
        this.creditslabel = makeDiv(null, 'title-button-label', 'Crédits');
        this.credits.append(this.creditslabel);

        this.buttons.append(this.start, this.credits);

        // For each button slide and increment the delay
        [ this.start, this.credits ].forEach((button) => {
            wait(delay, () => {
                addClass(button, 'slide');
                wait(300, () => { addClass(button, 'bounce'); });
            });
            delay += 300
        });

        // Delay the build infos by 400 milliseconds for dramatic effects
        delay += 400 + 300;

        // Create the bottom build info
        this.buildinfos = makeDiv(null, 'title-build', `version alpha - ${new Date().getFullYear()}`);

        // Slide the build button
        wait(delay, () => {
            addClass(this.buildinfos, 'slide');
            this.callback();
        });

        // Add every element to the page
        this.container.append(this.buttons, this.buildinfos);

        this.titlelisten = true;
        this.title.addEventListener('click', () => {
            if (this.titlelisten) {
                this.titlelisten = false;
                addClass(this.title, 'animate');
                wait(800, () => {
                    removeClass(this.title, 'animate');
                    wait(500, () => { this.titlelisten = true; });
                });
            }
        });

        this.startlabel.addEventListener('click', () => {
            // Define the next page here
            this.next = new Consent({
                app: this.app,
                position: 'next'
            });
            
            addClass(this.startlabel, 'clicked');
            this.app.slide('previous', this.next);
        });
    }
}

export default Title;