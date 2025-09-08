import Sound from "./sounds";
import { addClass, makeDiv, removeClass, wait } from "../utils/dom";

class SoundButton {
    constructor(options) {
        this.parent = options.parent;
        this.svg = options.svg;
        this.button = makeDiv(null, 'audio-button-container active');
        this.buttonchild = makeDiv(null, 'audio-button', this.svg);
        this.button.append(this.buttonchild);
        this.parent.append(this.button);

        this.active = true;
    }

    display(deactivate = true, callback) {
        callback = callback || function () { };
        addClass(this.button, 'pop');
        if (deactivate) {
            wait(300, () => {
                removeClass(this.button, 'active');
                this.active = false;
                callback();
            });
        } else {
            callback();
        }
    }
}

class Music extends SoundButton {
    constructor(options) {
        super(options);
        addClass(this.button, 'audio-button-music');

        this.sound = new Sound(options);

        // Handle play and pause from the web app
        this.button.addEventListener('click', () => {
            if (this.sound.isPlaying()) { this.sound.pause(); }
            else { this.sound.play(); }
        });

        // Handle play and pause from outside the webapp
        this.sound.audio.addEventListener('pause', () => { removeClass(this.button, 'active'); });
        this.sound.audio.addEventListener('play', () => { addClass(this.button, 'active'); });
    }
}

class SoundEffects extends SoundButton {
    constructor(options) {
        super(options);
        addClass(this.button, 'audio-button-sounds');

        this.button.addEventListener('click', () => {
            if (this.active) {
                removeClass(this.button, 'active');
                this.active = false;
            } else {
                addClass(this.button, 'active');
                this.active = true;
            }
        });
    }

    playFile(options) {
        if (this.active) {
            new Sound(options).play();
        }
    }
}

export { Music, SoundEffects }