import { addClass, removeClass, makeDiv, hasClass } from "../utils/dom.js";

class Entry {
    constructor(form) {
        this.form = form;
    }
}

class Form {
    constructor(page, content, footer) {
        this.page = page;
        this.content = content;
        this.footer = footer;
        this.container = makeDiv(null, 'form no-scrollbar');
        this.content.append(this.container);

        this.answers = []
    }

    add(...questions) {
        for (let i = 0; i < questions.length; i++) {
            let q = questions[i];
            let mandatory = q.mandatory;
            let multiple = q.multiple;

            let qcontainer = makeDiv(null, 'question-container');
            qcontainer.setAttribute('mandatory', mandatory);
            qcontainer.setAttribute('multiple', multiple);
            let question = makeDiv(null, 'question', q.question);
            qcontainer.append(question);

            let acontainer = makeDiv(null, 'answer-container');
            let answers = []
            for (let j = 0; j < q.answers.length; j++) {
                let unique = q.answers[j].unique;
                let answer = makeDiv(null, 'answer button-menu button ' + this.page.app.params.interface.theme, q.answers[j].text);
                answer.setAttribute('unique', unique);
                this.page.themed.push(answer);

                acontainer.append(answer);
                answers.push(answer);

                answer.addEventListener('click', () => {
                    if (hasClass(answer, 'selected')) {
                        removeClass(answer, 'selected');
                    } else {
                        if (!multiple || unique) {
                            this.unselectAnswers(i, false);
                        } else {
                            this.unselectAnswers(i, true);
                        }
                        addClass(answer, 'selected');
                    }

                });
            }
            qcontainer.append(acontainer);
            this.container.append(qcontainer);

            this.answers.push(answers);
        }
    }

    unselectAnswers(index, unique) {
        let a = this.answers[index]
        for (let k = 0; k < a.length; k++) {
            if (unique) {
                if (a[k].getAttribute('unique') === 'true') {
                    removeClass(a[k], 'selected')
                }
            } else {
                removeClass(a[k], 'selected')
            }
        }
    }
}

class ConsentForm {
    constructor(page, content, footer) {
        this.page = page;
        this.content = content;
        this.footer = footer;

        let text = `
            I accept that my game data are collected and used by the LostInZoom
            team to analyse the way we navigate inside interactive maps.<br>
            <br>
            The following data are collected by the team:<br>
            · Request form answers (sociological and cognitive tests).<br>
            · Game metrics (time elapsed, score, routing distance).<br>
            · Map interactions (pan, zoom in, zoom out).<br>
            <br>
            This game doesn't collect any personnal information such as your name or localization,
            nor any data specific to your device like your IP address or anything else.
            The dataset collected by itself will not be disclosed to the public. That being said,
            it will be used to conduct statistical analysis, and those analysis
            will be subject to one or multiple publication.<br>
            <br>
            By proceeding and signing this consent form, you have understood and accept
            the data hereby collected.
        `

        this.textContent = makeDiv(null, 'content-text no-scrollbar', text);
        this.checkboxcontainer = makeDiv(null, 'checkbox-container');
        this.checked = false;
        this.checkbox = makeDiv(null, 'checkbox ' + this.page.app.params.interface.theme);
        this.checkbox.addEventListener('click', () => { this.checking(); });

        this.checkboxlabel = makeDiv(null, 'checkbox-label', 'I understand.');
        this.checkboxcontainer.append(this.checkbox, this.checkboxlabel);

        this.content.append(this.textContent);
        this.footer.append(this.checkboxcontainer);
        this.page.themed.push(this.checkbox);
    }
    
    checking() {
        if (this.checked) { this.uncheck(); }
        else { this.check(); }
    }

    check() {
        addClass(this.checkbox, 'checked');
        this.checked = true;
    }

    uncheck() {
        removeClass(this.checkbox, 'checked');
        this.checked = false;
    }

    isChecked() {
        if (this.checked) { return true; }
        else { return false; }
    }
}

export { Form, ConsentForm };