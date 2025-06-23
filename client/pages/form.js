import { addClass, makeDiv, hasClass, addClass, removeClass, wait } from "../utils/dom";
import { remap, easeOutCubic, easeInCubic, easeOutSine } from "../utils/math";
import { pxToRem } from "../utils/parse";
import Consent from "./consent";
import Page from "./page";
import Title from "./title";

class Form extends Page {
    constructor(options, callback) {
        super(options, callback);

        addClass(this.container, 'page-form');

        this.content = makeDiv(null, 'page-content');
        this.back = makeDiv(null, 'page-button page-button-back', 'Retour');
        this.continue = makeDiv(null, 'page-button page-button-continue', 'Continuer');

        this.answers = []
        // Flag for the current question to display
        this.current = 0;

        this.text = makeDiv(null, 'form-text');
        this.questions = makeDiv(null, 'form-questions');
        let q = this.options.app.options.form[this.options.question];

        let mandatory = q.mandatory;
        let multiple = q.multiple;

        this.question = makeDiv(null, 'form-question', q.question);
        this.answerscontainer = makeDiv(null, 'form-answers');

        this.text.append(this.question, this.answerscontainer);

        this.content.append(this.back, this.text, this.continue);
        this.container.append(this.content);

        for (let i = 0; i < q.answers.length; i++) {
            let a = q.answers[i];

            let answer = makeDiv(null, 'form-answer', a.text);
            answer.setAttribute('unique', a.unique);
            this.answers.push(answer);
            this.answerscontainer.append(answer);

            answer.addEventListener('click', () => {
                if (hasClass(answer, 'selected')) {
                    removeClass(answer, 'selected');
                } else {
                    if (!multiple || a.unique) { this.unselectAnswers(false); }
                    else { this.unselectAnswers(true); }
                    addClass(answer, 'selected');
                }

                if (this.isAnswered()) { addClass(this.continue, 'pop'); }
                else { removeClass(this.continue, 'pop'); }
            });
        };

        wait(this.app.options.interface.transition.page, () => {
            addClass(this.back, 'pop');
            this.callback();
        });

        this.back.addEventListener('click', () => {
            if (this.options.question === 0) {
                // Define the next page here
                this.previous = new Consent({
                    app: this.app,
                    position: 'previous',
                });
            } else {
                // Define the next page here
                this.previous = new Form({
                    app: this.app,
                    position: 'previous',
                    question: this.options.question - 1,
                });
            }
            this.app.slide('next', this.previous);
        });

        this.continue.addEventListener('click', () => {
            if (this.options.question === this.options.app.options.form.length - 1) {
                // Define the next page here
                this.next = new Title({
                    app: this.app,
                    position: 'next',
                });
            } else {
                // Define the next page here
                this.next = new Form({
                    app: this.app,
                    position: 'next',
                    question: this.options.question + 1,
                });
            }
            this.app.slide('previous', this.next);
        });
    }

    unselectAnswers(unique) {
        this.answers.forEach((a) => {
            if (unique) {
                if (a.getAttribute('unique') === 'true') {
                    removeClass(a, 'selected')
                }
            } else {
                removeClass(a, 'selected')
            }
        });
    }

    isAnswered() {
        let result = false;
        for (let i = 0; i < this.answers.length; i++) {
            let a = this.answers[i];
            if (hasClass(a, 'selected')) { result = true; break; }
        }
        return result;
    }
}

export default Form;