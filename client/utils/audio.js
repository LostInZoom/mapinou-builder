import { generateRandomInteger } from "./parse";

class Sound {
    constructor(options) {
        this.options = options || {};
        this.src = options.src !== undefined ? options.src : null;
        this.format = options.format !== undefined ? options.format : 'mp3';
    }

    play(loop, callback) {
        callback = callback || function() {};
        this.audio.play();
        this.audio.addEventListener('ended', () => {
            if (loop) { this.play(loop); }
            else { callback(); }
        }, { once: true });
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
    }
}

export { SoundEffect, Music }