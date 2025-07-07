import { makeDiv } from "../utils/dom";
import { calculateTextWidth } from "../utils/parse";

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
        this.parent.append(this.container);

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
        let width = calculateTextWidth(this.value, getComputedStyle(this.text));
        this.text.style.width = `${width + 2}rem`;
        this.text.style.animationDuration = `${this.refresh * 2}ms`;
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
}

export default Score;