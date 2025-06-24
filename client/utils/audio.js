import { makeDiv, addClass, addSVG, removeClass, wait } from "./dom.js";
import { generateRandomInteger } from "./math.js";

class Sound {
    constructor(options) {
        this.options = options || {};
        this.parent = options.parent;
        this.svg = options.svg;
        this.src = options.src;
        this.format = options.format !== undefined ? options.format : 'mp3';

        this.started = false;
        this.playing = false;

        this.button = makeDiv(null, 'audio-button-container active');
        this.buttonchild = makeDiv(null, 'audio-button', this.svg);
        this.button.append(this.buttonchild);

        this.parent.append(this.button);

        this.button.addEventListener('click', () => { this.activate(); });
    }

    start(loop, callback) {
        callback = callback || function() {};
        this.audio.play();
        this.started = true;
        this.playing = true;
        this.audio.addEventListener('ended', () => {
            if (loop) { this.play(loop); }
            else { callback(); }
        }, { once: true });
    }

    displayButton() {
        addClass(this.button, 'pop');
        wait(300, () => {
            removeClass(this.button, 'active');
        });
    }

    fadeOut(duration, callback) {
        callback = callback || function() {};
        let increment = 10;
        let gap = (this.audio.volume * 100) / increment;
        let interval = setInterval(() => {
            let newvolume = this.audio.volume - (increment / 100);
            if (newvolume <= 0) {
                this.audio.volume = 0;
                clearInterval(interval);
                callback();
            } else {
                this.audio.volume = newvolume;
            }
        }, duration / gap);
    }
}

class SoundEffect extends Sound {
    constructor(options) {
        super(options);
        this.amount = options.amount !== undefined ? options.amount : 1;
        this.file = `${this.src}${generateRandomInteger(1, this.amount)}.${this.format}`;
        this.audio = new Audio(this.file);
    }
}

class Music extends Sound {
    constructor(options) {
        super(options);
        this.file = `${this.src}.${this.format}`;
        this.audio = new Audio(this.file);
        this.volume = this.audio.volume;

        this.audio.addEventListener('pause', () => {
            removeClass(this.button, 'active');
            this.playing = false;
        });
        this.audio.addEventListener('play', () => {
            addClass(this.button, 'active');
            this.playing = true;
        });
    }

    play() {
        if (this.started) {
            this.audio.play();
        }
        else { this.start(true); }
    }

    pause() {
        if (this.started && this.playing) {
            this.audio.pause();
        }
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.started = false;
        this.playing = false;
    }

    activate() {
        if (this.playing) { this.pause(); }
        else { this.play(); }
    }
}

export { SoundEffect, Music }