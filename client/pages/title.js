import { Basemap } from "../cartography/map";
import { Roamer } from "../characters/roamer";
import { addClass, makeDiv, wait } from "../utils/dom";
import { remap, easeOutCubic } from "../utils/math";
import { pxToRem } from "../utils/parse";
import Page from "./page";

class Title extends Page {
    constructor(options) {
        super(options);
        addClass(this.container, 'page-title');

        // Generate the basemap
        this.basemap = new Basemap({
            page: this,
            class: 'map-title',
            center: [ 291041.84, 5629996.16 ],
            zoom: 15
        // Wait for the map to load before making the menu
        }, () => {
            // Create the title div and the container for the individual letters
            this.title = makeDiv(null, 'title-name');
            this.letters = makeDiv(null, 'title-letters');
            this.title.append(this.letters);

            // Start with a delay of 100 milliseconds to make sure the element is loaded by the DOM
            // and reveal the title background
            let delay = 100;
            wait(delay, () => { addClass(this.title, 'slide'); })
            // Add a delay of 300 milliseconds to make sure the title background is revealed
            delay += 300;
            
            // Set the title name
            this.name = 'Cartogame'

            // Get the width of the page in rem
            let width = pxToRem(this.container.offsetWidth);
            // Set the time taken by the letters animation
            let animationtime = width * 10;
            
            // Calculate individual letters animation time
            let lettertime = animationtime / this.name.length;
            
            // Loop through the name to get individual letters
            for (let i = (this.name.length - 1), j = 0; i >= 0; i--, j++) {
                // Create the letter element translated by the width of the page * 1.1
                let character = makeDiv(null, 'title-letter', this.name.charAt(j));
                character.style.transform = `translateX(-${width*1.1}rem)`;
                this.letters.append(character);

                // Remap the delay, from [0, animationtime] to [0, 1]
                let remapped = remap(i * lettertime, 0, animationtime);
                // Calculate the remapped easing out cubic value 
                let easing = easeOutCubic(remapped) * animationtime;
                // Wait the easing value for each letter before the translation
                wait(easing + delay, () => { character.style.transform = `translateX(0)`; });
            }

            // Increment the delay by the letters animation time
            delay += 300 + animationtime;
            // Bounce the whole title letters and add the time of the animation to the delay
            wait(delay, () => { addClass(this.letters, 'bounce'); })
            delay += 400;

            // Create the start and credits buttons
            this.buttoncontainer = makeDiv(null, 'button-title-container');
            this.start = makeDiv(null, 'button-title button-start');
            this.startlabel = makeDiv(null, 'button-title-label hidden', 'Play');
            this.start.append(this.startlabel);
            this.credits = makeDiv(null, 'button-title button-credits');
            this.creditslabel = makeDiv(null, 'button-title-label hidden', 'Credits');
            this.credits.append(this.creditslabel);
            this.buttoncontainer.append(this.start, this.credits);

            // For each button slide and increment the delay
            [ this.start, this.credits ].forEach((button) => {
                wait(delay, () => { addClass(button.firstChild, 'slide'); });
                delay += 300
            });

            // Delay the build infos by 400 milliseconds for dramatic effects
            delay += 400;

            // Create the bottom build info
            this.buildinfos = makeDiv(null, 'title-build', `alpha build - ${new Date().getFullYear()}`);

            // Slide the build button
            wait(delay, () => { addClass(this.buildinfos, 'slide'); });

            // Add every element to the page
            this.container.append(this.title, this.buttoncontainer, this.buildinfos);

            this.basemap.map.on('click', (e) => {
                let coords = this.basemap.map.getEventCoordinate(event);
                
                let rabbit = new Roamer({
                    basemap: this.basemap,
                    coordinates: coords,
                    color: 'random',
                });

                rabbit.display();
            });
        });
    }
}

export default Title;