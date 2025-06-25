import { ajaxPost } from "../utils/ajax";
import { addClass, makeDiv, hasClass, addClass, removeClass, wait } from "../utils/dom";
import Consent from "./consent";
import Levels from "./levels";
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

        this.question = this.options.app.options.form[this.options.question];
        let multiple = this.question.multiple;

        this.label = makeDiv(null, 'form-question', this.question.question);
        this.answerscontainer = makeDiv(null, 'form-answers');

        this.text.append(this.label, this.answerscontainer);

        this.content.append(this.back, this.text, this.continue);
        this.container.append(this.content);

        for (let i = 0; i < this.question.answers.length; i++) {
            let a = this.question.answers[i];
            let answer = makeDiv(null, 'form-answer', a.text);

            if (this.question.answer) {
                if (this.question.answer.includes(i)) {
                    addClass(answer, 'selected');
                }
            }

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
            if (this.isAnswered()) { addClass(this.continue, 'pop'); }
            this.callback();
        });

        this.back.addEventListener('click', () => {
            this.saveAnswer();
            if (this.options.question === 0) {
                if (this.app.options.session.consent) {
                    this.previous = new Title({
                        app: this.app,
                        position: 'previous',
                    });
                } else {
                    this.previous = new Consent({
                        app: this.app,
                        position: 'previous',
                    });
                }
            } else {
                this.previous = new Form({
                    app: this.app,
                    position: 'previous',
                    question: this.options.question - 1,
                });
            }
            this.app.slide({
                position: 'next',
                page: this.previous
            });
        });

        this.continue.addEventListener('click', () => {
            this.saveAnswer();
            if (this.options.question === this.options.app.options.form.length - 1) {
                this.next = new Levels({
                    app: this.app,
                    position: 'next',
                });

                ajaxPost('form/', { form: this.options.app.options.form }, (status) => {

                });
            } else {
                this.next = new Form({
                    app: this.app,
                    position: 'next',
                    question: this.options.question + 1,
                });
            }
            this.app.slide({
                position: 'previous',
                page: this.next
            });
        });
    }

    title() {
        this.previous = new Title({ app: this.app, position: 'previous' });
    }

    levels() {

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

    saveAnswer() {
        let result = [];
        for (let i = 0; i < this.answers.length; i++) {
            let a = this.answers[i];
            if (hasClass(a, 'selected')) { result.push(i); }
        }
        this.question.answer = result;
    }
}

export default Form;