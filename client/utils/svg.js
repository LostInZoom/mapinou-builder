import { addClass, makeDiv } from "./dom";

class LevelEdges {
    constructor(options) {
        this.options = options;
        this.parent = options.parent;
        this.namespace = 'http://www.w3.org/2000/svg';

        this.container = makeDiv(null, 'levels-svg');
        this.svg = document.createElementNS(this.namespace, 'svg');

        this.parent.append(this.container);
        this.container.append(this.svg);

        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.svg.setAttribute('viewBox', `0 0 ${this.width} ${this.height}`);
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        // this.svg.setAttribute('preserveAspectRatio', 'none');

        this.lines = [];
    }

    addLine(x1, y1, x2, y2) {
        let line = document.createElementNS(this.namespace, 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        this.svg.append(line);
        let length = line.getTotalLength()
        line.setAttribute('stroke-dasharray', length);
        line.setAttribute('stroke-dashoffset', length);
        line.setAttribute('stroke-linecap', 'round');
        this.lines.push(line);
        addClass(line, 'reveal');
    }

    get() {
        return this.svg;
    }

    thinOutLines() {
        this.lines.forEach((line) => {
            addClass(line, 'thinout');
        });
    }
}

export { LevelEdges };