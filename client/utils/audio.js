import { makeDiv, addClass, removeClass, wait, hasClass } from "./dom.js";
import { generateRandomInteger } from "./math.js";

class Sound {
    constructor(options) {
        this.options = options || {};
        this.src = options.src;
        this.format = options.format !== undefined ? options.format : 'mp3';
        this.started = false;
        this.playing = false;
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

    play() {
        if (this.started) { this.audio.play(); }
        else { this.start(true); }
    }

    pause() {
        if (this.started && this.playing) { this.audio.pause(); }
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.started = false;
        this.playing = false;
    }
}

class SoundEffect extends Sound {
    constructor(options) {
        super(options);
        this.amount = options.amount !== undefined ? options.amount : 1;
        if (this.amount > 1) { this.file = `${this.src}${generateRandomInteger(1, this.amount)}.${this.format}`; }
        else { this.file = `${this.src}.${this.format}`; }
        this.audio = new Audio(this.file);
    }

    play() {
        this.audio.play();
    }
}

class Music extends Sound {
    constructor(options) {
        super(options);
        this.file = `${this.src}.${this.format}`;
        this.audio = new Audio(this.file);
        this.volume = this.audio.volume;
    }

    activate() {
        if (this.playing) { this.pause(); }
        else { this.play(); }
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

class AudioButton {
    constructor(options) {
        this.parent = options.parent;
        this.svg = options.svg;
        this.button = makeDiv(null, 'audio-button-container active');
        this.buttonchild = makeDiv(null, 'audio-button', this.svg);
        this.button.append(this.buttonchild);
        this.parent.append(this.button);
    }

    
}

class SoundEffectsButton extends AudioButton {
    constructor(options) {
        super(options);
        this.active = true;
        addClass(this.button, 'audio-button-sounds');

        this.button.addEventListener('click', () => {
            if (hasClass(this.button, 'active')) {
                removeClass(this.button, 'active');
                this.active = false;
            } else {
                addClass(this.button, 'active');
                this.active = true;
            }
        });
    }

    playFile(options, callback) {
        let sound = new SoundEffect(options);
        sound.start(false, callback);
    }

    display(deactivate=true, callback) {
        callback = callback || function() {};
        addClass(this.button, 'pop');
        if (deactivate) {
            wait(300, () => {
                removeClass(this.button, 'active');
                callback();
                this.active = false;
            });
        } else {
            callback();
        }
    }
}

class MusicButton extends AudioButton {
    constructor(options) {
        super(options);
        addClass(this.button, 'audio-button-music');

        this.sound = new Music(options);

        // Handle play and pause from the web app
        this.button.addEventListener('click', () => { this.sound.activate(); });

        // Handle play and pause from outside the webapp
        this.sound.audio.addEventListener('pause', () => {
            removeClass(this.button, 'active');
            this.sound.playing = false;
        });
        this.sound.audio.addEventListener('play', () => {
            addClass(this.button, 'active');
            this.sound.playing = true;
        });
    }

    display(deactivate=true, callback) {
        callback = callback || function() {};
        addClass(this.button, 'pop');
        if (deactivate) {
            wait(300, () => { removeClass(this.button, 'active'); callback(); });
        } else {
            callback();
        }
    }
}

export { Music, SoundEffect, SoundEffectsButton, MusicButton }