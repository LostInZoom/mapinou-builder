import { makeDiv, removeClass, wait } from "../utils/dom";
import { weightedRandom } from "../utils/math";

class Hint {
    constructor(options) {
        this.options = options;
        this.level = this.options.level;
        this.params = this.level.params;
        this.hints = this.level.parameters.hints;

        this.state = 'move';
        this.idle = false;
        this.color = this.params.game.color;
        this.orientation = 'east';
        this.frame = 0;
        this.injured = false;

        this.hintcontainer = makeDiv(null, 'level-hint-container');
        this.character = makeDiv(null, 'level-hint-character hidden');
        this.charimage = document.createElement('img');
        this.charimage.src = this.params.sprites[`rabbits:${this.color}_${this.state}_${this.orientation}_${this.frame}`];
        this.charimage.alt = 'character';
        this.character.append(this.charimage);

        this.hintcontainer.append(this.character);
        this.level.container.append(this.hintcontainer);
        this.hintcontainer.offsetWidth;

        this.startFrameAnimation = 0;
        this.animateFrame();

        removeClass(this.character, 'hidden');
        wait(600, () => {
            this.setState('idle');
            this.idle = true;
        });
    }

    reload() {
        this.charimage.src = this.params.sprites[`rabbits:${this.color}_${this.state}_${this.orientation}_${this.frame}`];
    }

    setColor(color) {
        this.color = color;
        this.reload();
    }

    setState(state) {
        this.state = state;
        this.reload();
    }

    setOrientation(orientation) {
        this.orientation = orientation;
        this.reload();
    }

    setFrame(frame) {
        this.frame = frame;
        this.reload();
    }

    injure(duration, blink, callback) {
        callback = callback || function () { };
        const origin = this.color;
        const start = performance.now();

        this.injured = true;
        let lastBlink = start;

        this.setColor('red');
        let visible = false;

        const animate = (time) => {
            if (this.injured) {
                const elapsed = time - start;
                if (elapsed >= duration) {
                    this.injured = false;
                    this.setColor(origin);
                    callback();
                } else {
                    if (time - lastBlink >= blink) {
                        visible = !visible;
                        this.setColor(visible ? origin : 'red');
                        lastBlink = time;
                    }
                    requestAnimationFrame(animate);
                }
            }
        };
        requestAnimationFrame(animate);
    }

    animateFrame() {
        this.startFrameAnimation = performance.now();
        let start = this.startFrameAnimation;
        const weights = [10, 1];
        const statespool = ['idle', 'graze'];
        const animation = () => {
            wait(200, () => {
                if (start === this.startFrameAnimation) {
                    this.frame = (this.frame + 1) % 4;
                    if (this.frame === 0 && this.idle) { this.state = weightedRandom(statespool, weights.slice()); }
                    this.reload();
                    requestAnimationFrame(animation);
                }
            });
        };
        requestAnimationFrame(animation);
    }
}

export default Hint;