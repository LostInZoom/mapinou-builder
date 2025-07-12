import { generateRandomInteger } from "./math.js";

class Sound {
    constructor(options) {
        this.options = options || {};
        this.src = options.src;
        this.format = options.format !== undefined ? options.format : 'mp3';
        this.loop = options.loop !== undefined ? options.loop : false;
        this.amount = options.amount !== undefined ? options.amount : 1;

        if (this.amount > 1) { this.file = `${this.src}${generateRandomInteger(1, this.amount)}.${this.format}`; }
        else { this.file = `${this.src}.${this.format}`; }

        this.audio = new Audio(this.file);
        this.audio.loop = this.loop;
    }

    play() {
        if (this.audio.paused) { this.audio.play(); }
    }

    pause() {
        if (!this.audio.paused) { this.audio.pause(); }
    }

    stop() {
        if (!this.audio.paused) { this.audio.pause(); }
        this.audio.currentTime = 0;
    }

    isPlaying() {
        return !this.audio.paused;
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

export default Sound;