import { addClass, makeDiv } from "./dom";

class LevelEdges {
    constructor(options) {
        this.options = options;
        this.parent = options.parent;
        this.namespace = 'http://www.w3.org/2000/svg';
        this.animation = options.animation;

        this.container = makeDiv(null, 'levels-svg');
        this.svg = document.createElementNS(this.namespace, 'svg');

        this.parent.append(this.container);
        this.container.append(this.svg);

        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');

        this.lines = [];
    }

    addLine(x1, y1, x2, y2, start, end) {
        let line = document.createElementNS(this.namespace, 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('start', start);
        line.setAttribute('end', end);
        this.svg.append(line);
        let length = line.getTotalLength();
        line.setAttribute('stroke-dasharray', length);
        line.setAttribute('stroke-dashoffset', length);
        line.setAttribute('stroke-linecap', 'round');
        this.lines.push(line);
        if (this.animation) { addClass(line, 'reveal'); }
        else { addClass(line, 'appear'); }
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.setAttribute('height', `${this.height}`);
        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
    }

    moveLineStart(i, x, y) {
        if (this.lines[i]) {
            this.lines[i].setAttribute('x1', x);
            this.lines[i].setAttribute('y1', y);
        }
    }

    moveLineEnd(i, x, y) {
        if (this.lines[i]) {
            this.lines[i].setAttribute('x2', x);
            this.lines[i].setAttribute('y2', y);
        }
    }

    get() {
        return this.svg;
    }

    getLines() {
        return this.lines;
    }

    getLinesNumber() {
        return this.lines.length;
    }

    thinOutLines() {
        this.lines.forEach((line) => {
            addClass(line, 'thinout');
        });
    }
}

export { LevelEdges };