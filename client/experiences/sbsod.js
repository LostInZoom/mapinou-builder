import Levels from "../pages/levels";
import Page from "../pages/page";
import { addClass, makeDiv, removeClass, removeClassList, wait } from "../utils/dom";
import { easeInOutSine, remap } from "../utils/math";

class SantaBarbara extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.stage = this.options.stage;
        this.elements = this.options.elements;
        this.answers = this.options.answers ?? new Array(this.elements.content.length).fill(undefined);

        this.content = makeDiv(null, 'page-content pop');
        this.back = makeDiv(null, 'page-button page-button-back', 'Retour');
        this.continue = makeDiv(null, 'page-button page-button-continue', 'Continuer');

        this.text = makeDiv(null, 'sbsod-text');
        if (this.stage === 'form') { addClass(this.text, 'pop'); }
        this.content.append(this.back, this.text, this.continue);
        this.container.append(this.content);

        if (this.stage === 'tutorial') {
            this.basemap.fly({
                duration: 500,
                easing: easeInOutSine,
                center: this.elements.start.center,
                zoom: this.elements.start.zoom
            }, () => {
                this.createTutorial();
            });
        }
        else if (this.stage === 'form') {
            this.createForm();
        }
    }

    createTutorial() {
        let tutorial = makeDiv(null, 'sbsod-tutorial');
        this.elements.tutorial.forEach(t => {
            tutorial.append(makeDiv(null, 'sbsod-tutorial-paragraph', t));
        });
        this.text.append(tutorial);

        this.back.offsetWidth;
        this.text.offsetWidth;
        this.continue.offsetWidth;

        addClass(this.text, 'pop');
        wait(300, () => {
            addClass(this.back, 'pop');
            addClass(this.continue, 'pop');

            this.back.addEventListener('click', () => {
                removeClass(this.content, 'pop');
                wait(300, () => {
                    this.destroy();
                    this.basemap.fit(this.params.interface.map.levels, {
                        duration: 500,
                        easing: easeInOutSine
                    }, () => {
                        this.app.page = new Levels({ app: this.app, position: 'current' });
                    });
                })
            }, { once: true });

            this.continue.addEventListener('click', () => {
                let o = this.options;
                o.stage = 'form';
                o.position = 'next';
                o.answers = this.answers;
                this.next = new SantaBarbara(o);
                this.slideNext();
            }, { once: true })
        });
    }

    createForm() {
        let questions = makeDiv(null, 'sbsod-questions no-scrollbar');
        this.text.append(questions);

        let content = this.elements.content;
        for (let c = 0; c < content.length; c++) {
            let chosen = this.answers[c] !== undefined ? true : false;

            const q = content[c];
            let element = makeDiv(null, 'sbsod-element');
            let question = makeDiv(null, 'sbsod-question', q);
            let answers = makeDiv(null, 'sbsod-answers');

            let choice = makeDiv(null, 'sbsod-choice');
            let points = makeDiv(null, 'sbsod-points');
            let numbers = makeDiv(null, 'sbsod-numbers');
            for (let i = 0; i < 7; i++) {
                let p = makeDiv(null, 'sbsod-point');
                let n = makeDiv(null, 'sbsod-number', i + 1);
                p.setAttribute('value', i);
                points.append(p);
                numbers.append(n);
                if (chosen && i === this.answers[c]) {
                    addClass(n, 'active');
                }

                p.addEventListener('click', () => {
                    let pointList = numbers.childNodes;
                    pointList.forEach(child => { removeClass(child, 'active'); });
                    addClass(pointList[i], 'active');

                    let perc = remap(i, 0, 6, 0, 100);
                    choice.style.left = `calc(${perc}% - ${Math.floor(perc * Math.ceil(p.offsetWidth) / 100)}px)`;

                    if (!chosen) {
                        chosen = true;
                        addClass(choice, 'pop');
                    }

                    this.answers[c] = parseInt(p.getAttribute('value'));

                    let end = this.answers.every(v => v !== undefined);
                    if (end) { addClass(this.continue, 'pop'); }
                    else { removeClass(this.continue, 'pop'); }
                });
            }

            let scale = makeDiv(null, 'sbsod-scale');
            let ptd = makeDiv(null, 'sbsod-label', "Pas du tout d'accord");
            let tfd = makeDiv(null, 'sbsod-label', "Tout à fait d'accord");
            scale.append(ptd, tfd);

            answers.append(points, choice, numbers);
            element.append(question, answers, scale);
            questions.append(element);

            if (chosen) {
                wait(this.app.options.interface.transition.page, () => {
                    addClass(choice, 'pop');
                    let perc = remap(this.answers[c], 0, 6, 0, 100);
                    choice.style.left = `calc(${perc}% - ${perc * Math.ceil(points.childNodes[this.answers[c]].offsetWidth) / 100}px)`;
                });
            }
        };

        wait(this.app.options.interface.transition.page, () => {
            let end = this.answers.every(v => v !== undefined);
            if (end) { addClass(this.continue, 'pop'); }
            addClass(this.back, 'pop');

            this.back.addEventListener('click', () => {
                let o = this.options;
                o.stage = 'tutorial';
                o.position = 'previous';
                o.answers = this.answers;
                this.previous = new SantaBarbara(o);
                this.slidePrevious();
            }, { once: true })
        });
    }
}

export default SantaBarbara;