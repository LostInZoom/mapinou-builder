class Score {
    constructor(value, increment, interval, html) {
        this.value = value;
        this.increment = increment;
        this.interval = interval;
        this.html = html;
        this.object;
    }

    add(value) {
        this.value += value;
        this.html.innerHTML = this.value;
    }

    start() {
        this.stop();
        this.object = setInterval(() => {
            this.value += this.increment;
            this.html.innerHTML = this.value;
        }, this.interval);
    }

    stop() {
        if (this.object !== undefined) { clearInterval(this.object); }
    }

    change(increment, interval) {
        this.stop();
        this.increment = increment;
        this.interval = interval;
        this.start();
    }
}

export default Score;