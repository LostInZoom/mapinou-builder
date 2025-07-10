import { Header } from "../interface/elements";
import { addClass, makeDiv, removeClass, wait } from "../utils/dom";
import { calculateTextSize } from "../utils/parse";

class Score {
    constructor(options) {
        this.parent = options.parent;
        this.level = options.level;
        this.params = this.level.options.app.options;

        this.value = options.value || 0;
        this.states = options.states || [ 'stopped', 'default', 'movement' ];
        this.state = options.state || 'stopped'

        this.running = false;

        this.interval;
        this.container = makeDiv(null, 'score-container');
        this.text = makeDiv(null, 'score-text');
        this.container.append(this.text);

        if (this.parent instanceof Header) { this.parent.insertAtIndex(this.container, 2); }
        else { this.parent.append(this.container); }

        this.setState(this.state);
        this.update();
    }

    get() {
        return this.value;
    }

    add(value) {
        this.value += value;
        this.text.innerHTML = this.value;
    }

    start() {
        if (this.state === 'stopped') { this.setState('default'); }
        this.stop();
        this.running = true;
        this.increment = this.params.game.score.increment[this.state];
        this.refresh = this.params.game.score.refresh[this.state];
        this.text.style.animationDuration = `${this.refresh * 2}ms`;
        this.interval = setInterval(() => {
            this.value += this.increment;
            this.update();
        }, this.refresh);
    }

    stop() {
        if (this.interval !== undefined) { clearInterval(this.interval); }
        this.running = false;
    }

    update() {
        this.text.innerHTML = this.value;
        let width = calculateTextSize(this.value, getComputedStyle(this.text)).width + 1.7;
        if (width < 2.5) { width = 2.5 }
        this.text.style.width = `${width}rem`;
    }

    setState(state) {
        if (this.states.includes(state)) {
            let running = this.running;
            removeClass(this.text, this.state);
            this.stop();
            this.state = state;
            addClass(this.text, this.state);
            if (running) { this.start(); }
        }
    }

    pop(callback) {
        callback = callback || function() {};
        addClass(this.container, 'pop');
        wait(200, callback);
    }
}

export default Score;