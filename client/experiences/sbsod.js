import { addClass, makeDiv } from "../utils/dom";

class SantaBarbara {
    constructor(options) {
        this.options = options;
        this.page = this.options.page;
        this.elements = this.options.elements;

        this.content = makeDiv(null, 'page-content');
        this.back = makeDiv(null, 'page-button page-button-back', 'Retour');
        this.continue = makeDiv(null, 'page-button page-button-continue', 'Continuer');

        this.text = makeDiv(null, 'sbsod-text');
        this.content.append(this.back, this.text, this.continue);
        this.page.container.append(this.content);

        let tutorial = makeDiv(null, 'sbsod-tutorial', this.elements.tutorial);
        let questions = makeDiv(null, 'sbsod-questions no-scrollbar');
        this.text.append(tutorial, questions);

        this.elements.content.forEach(e => {
            let c = makeDiv(null, 'sbsod-element');
            let question = makeDiv(null, 'sbsod-question', e);

            let line = makeDiv(null, 'sbsod-line');

            let acontainer = makeDiv(null, 'sbsod-answers');
            let l1 = makeDiv(null, 'sbsod-line1');
            let l2 = makeDiv(null, 'sbsod-line2');
            let p1 = makeDiv(null, 'sbsod-points1');
            let p2 = makeDiv(null, 'sbsod-points2');
            for (let i = 0; i < 7; i++) {
                acontainer.append(makeDiv(null, 'sbsod-answer sbsod-answer-' + i));
                p1.append(makeDiv(null, 'sbsod-point'));
                p2.append(makeDiv(null, 'sbsod-point', i + 1));
            }

            line.append(l1, p1, l2, p2);

            c.append(question, line, acontainer);
            questions.append(c);
        });

        this.text.offsetWidth;
        addClass(this.text, 'pop');
    }
}

export default SantaBarbara;