import Page from "../pages/page";
import { addClass, addClassList, makeDiv, removeClass, removeClassList, wait } from "../utils/dom";
import { easeInOutSine, generateRandomInteger } from "../utils/math";

class Piaget extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.elements = this.options.elements;

        this.content = makeDiv(null, 'page-content pop');
        this.container.append(this.content);

        this.topcontent = makeDiv(null, 'piaget-content top pop');
        this.back = makeDiv(null, 'page-button page-button-back', 'Retour');
        this.toptext = makeDiv(null, 'piaget-text top');
        this.topcontent.append(this.back, this.toptext);
        this.content.append(this.topcontent);

        let toplabel = makeDiv(null, 'piaget-tutorial', this.elements.top);
        this.topbottle = makeDiv(null, 'piaget-bottle reference', this.app.options.svgs.piaget);
        this.toptext.append(toplabel, this.topbottle);

        this.bottomcontent = makeDiv(null, 'piaget-content bottom pop');
        this.content.append(this.bottomcontent);
        this.createBottomPanel(1);

        let centers = this.app.options.interface.map.start.centers;
        let i = generateRandomInteger(0, centers.length - 1);

        this.basemap.fly({
            duration: 500,
            easing: easeInOutSine,
            center: centers[i],
            zoom: this.app.options.interface.map.start.zoom
        }, () => {
            addClass(this.toptext, 'pop');

            wait(300, () => {
                addClass(this.back, 'pop');
                addClass(this.bottomtext, 'pop');
            });
        });
    }

    createBottomPanel(index) {
        let pursue = makeDiv(null, 'page-button page-button-continue', 'Continuer');
        this.bottomtext = makeDiv(null, 'piaget-text bottom');
        this.bottomcontent.append(this.bottomtext, pursue);
        let bottomlabel = makeDiv(null, 'piaget-tutorial', this.elements.bottom);
        let bottombottle = makeDiv(null, 'piaget-bottle draw', this.app.options.svgs['piaget' + index]);
        this.bottomtext.append(bottomlabel, bottombottle);

        let namespace = 'http://www.w3.org/2000/svg';
        let svgcontainer = makeDiv(null, 'piaget-svg-container');
        let svg = document.createElementNS(namespace, 'svg');
        svgcontainer.append(svg);
        bottombottle.append(svgcontainer);

        const vb = bottombottle.querySelector('svg').viewBox.baseVal;
        svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.width} ${vb.height}`);
        svg.setAttribute('width', '800');
        svg.setAttribute('height', '800');

        let lines = [];
        let start = [];
        let end = [];

        const destroyElements = () => {
            if (lines.length > 0) {
                let oldline = lines.pop();
                addClass(oldline, 'hide');
                wait(200, () => { oldline.remove(); })
            }
            if (start.length > 0) {
                let oldstart = start.pop();
                addClass(oldstart, 'hide');
                wait(200, () => { oldstart.remove(); })
            }
            if (end.length > 0) {
                let oldend = end.pop();
                addClass(oldend, 'hide');
                wait(200, () => { oldend.remove(); })
            }
            lines = [];
            start = [];
            end = [];
        }

        const createElements = (x, y) => {
            let l = document.createElementNS(namespace, 'line');
            l.setAttribute('x1', x);
            l.setAttribute('y1', y);
            l.setAttribute('x2', x);
            l.setAttribute('y2', y);
            lines.push(l);
            let p1 = document.createElementNS(namespace, 'circle');
            p1.setAttribute('cx', x);
            p1.setAttribute('cy', y);
            start.push(p1);
            let p2 = document.createElementNS(namespace, 'circle');
            p2.setAttribute('cx', x);
            p2.setAttribute('cy', y);
            end.push(p2);
            addClassList([p1, p2, l], 'hide');
            svg.append(l, p1, p2);
            svgcontainer.offsetHeight;
            removeClassList([p1, p2, l], 'hide');
        }

        const down = (e) => {
            e.preventDefault();
            destroyElements();
            bottombottle.removeEventListener('touchstart', down);
            const [x, y] = this.getRelativeCoordinates(bottombottle, e);
            createElements(x, y);
            bottombottle.addEventListener('touchmove', move);
            bottombottle.addEventListener('touchend', up);
        }

        const move = (e) => {
            e.preventDefault();
            const [x, y] = this.getRelativeCoordinates(bottombottle, e);
            lines[0].setAttribute('x2', x);
            lines[0].setAttribute('y2', y);
            end[0].setAttribute('cx', x);
            end[0].setAttribute('cy', y);
        }

        const up = (e) => {
            e.preventDefault();
            bottombottle.removeEventListener('touchmove', move);
            bottombottle.removeEventListener('touchend', up);
            // Remove the lines and points if the length is lower than 10% of the svg width
            const length = Math.hypot(lines[0].x2.baseVal.value - lines[0].x1.baseVal.value, lines[0].y2.baseVal.value - lines[0].y1.baseVal.value);
            if (length < 10 * vb.width / 100) {
                destroyElements();
                removeClass(pursue, 'pop');
            } else {
                addClass(pursue, 'pop');
            }
            bottombottle.addEventListener('touchstart', down);
        }

        bottombottle.addEventListener('touchstart', down);
    }

    getRelativeCoordinates(container, event) {
        const touch = event.touches ? event.touches[0] : event;
        const rect = container.getBoundingClientRect();
        const xRel = touch.clientX - rect.left;
        const yRel = touch.clientY - rect.top;
        const vb = container.querySelector('svg').viewBox.baseVal;
        const x = xRel / rect.width * vb.width + vb.x;
        const y = yRel / rect.height * vb.height + vb.y;
        return [x, y];
    }
}

export default Piaget;