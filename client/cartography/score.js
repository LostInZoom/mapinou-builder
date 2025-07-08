import { Header } from "../interface/elements";
import { addClass, makeDiv, removeClass, wait } from "../utils/dom";
import { calculateTextSize } from "../utils/parse";

class Score {
    constructor(options) {
        this.parent = options.parent;
        this.value = options.value || 0;
        this.increment = options.increment || this.parent.options.app.options.game.score.increment.default;
        this.refresh = options.refresh || this.parent.options.app.options.game.score.refresh.default;

        this.interval;
        this.container = makeDiv(null, 'score-container');
        this.text = makeDiv(null, 'score-text');
        this.container.append(this.text);

        if (this.parent instanceof Header) {
            this.parent.insertAtIndex(this.container, 2);
        } else {
            this.parent.append(this.container);
        }

        this.setState(options.state || 'default');
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
        this.stop();
        this.interval = setInterval(() => {
            this.value += this.increment;
            this.update();
        }, this.refresh);
    }

    update() {
        this.text.innerHTML = this.value;
        let width = calculateTextSize(this.value, getComputedStyle(this.text)).width + 1.7;
        if (width < 2.5) { width = 2.5 }
        this.text.style.width = `${width}rem`;
    }

    stop() {
        if (this.interval !== undefined) { clearInterval(this.interval); }
    }

    change(increment, refresh) {
        this.stop();
        this.increment = increment;
        this.refresh = refresh;
        this.start();
    }

    setState(state) {
        removeClass(this.text, this.state);
        addClass(this.text, state);
        this.state = 'state';
    }

    pop(callback) {
        callback = callback || function() {};
        addClass(this.container, 'pop');
        wait(200, callback);
    }
}

export default Score;