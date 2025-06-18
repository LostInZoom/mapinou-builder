import { addClass, isOverflown, makeDiv, removeClass, wait } from "../utils/dom";
import Page from "./page";
import Title from "./title";

class Consent extends Page {
    constructor(app, position) {
        super(app, position);
        addClass(this.container, 'page-consent');

        this.content = makeDiv(null, 'consent-content');

        this.back = makeDiv(null, 'consent-button consent-button-back', 'Retour');
        this.continue = makeDiv(null, 'consent-button consent-button-continue', 'Continuer');

        this.form = makeDiv(null, 'consent-form');
        this.title = makeDiv(null, 'consent-title', 'Formulaire de consentement');
        this.elements = makeDiv(null, 'consent-elements no-scrollbar');
        this.scrollindicator = makeDiv(null, 'consent-scroll-indicator', '▼');
        this.form.append(this.title, this.elements, this.scrollindicator);

        this.content.append(this.back, this.form, this.continue);
        this.container.append(this.content);

        this.app.options.consent.forEach((element) => {
            let e = makeDiv(null, 'consent-element');
            if (element.type === 'paragraph') {
                addClass(e, 'consent-paragraph');
                e.innerHTML = element.content;
            }
            else if (element.type === 'list') {
                addClass(e, 'consent-list');
                if ('title' in element) {
                    let t = makeDiv(null, 'consent-list-title', element.title);
                    e.append(t);
                }

                let entries = document.createElement('ul');
                element.content.forEach((l) => {
                    let entry = document.createElement('li');
                    addClass(entry, 'consent-list-entry');
                    entry.innerHTML = l;
                    entries.append(entry);
                });
                e.append(entries);
            }
            this.elements.append(e);
        });

        this.checked = false;
        this.checkbox = makeDiv(null, 'consent-checkbox');
        this.checkboxbutton = makeDiv(null, 'consent-checkbox-button');
        this.checkboxlabel = makeDiv(null, 'consent-checkbox-label', `D'accord`);

        this.checkbox.append(this.checkboxbutton, this.checkboxlabel);
        this.elements.append(this.checkbox);

        this.checkbox.addEventListener('click', () => { this.checking(); });

        wait(this.app.options.interface.transition.page, () => {
            addClass(this.back, 'pop');

            this.observer = new ResizeObserver(() => {
                if (isOverflown(this.elements)) {
                    addClass(this.scrollindicator, 'active');
                } else {
                    removeClass(this.scrollindicator, 'active');
                }
            }).observe(this.elements);

            this.scrollindicator.addEventListener('click', () => {
                this.elements.scrollBy({
                    top: this.elements.scrollHeight,
                    behavior: 'smooth'
                });
            });

            this.back.addEventListener('click', () => {
                // Define the previous page here
                this.previous = new Title({
                    app: this.app,
                    position: 'previous'
                });

                this.app.slide('next', this.previous);
            });

            this.continue.addEventListener('click', () => {
                // Define the next page here
                this.next = new Title({
                    app: this.app,
                    position: 'next'
                });

                this.app.slide('previous', this.next);
            });
        });
    }

    checking() {
        if (this.checked) { this.uncheck(); }
        else { this.check(); }
    }

    check() {
        addClass(this.checkbox, 'checked');
        addClass(this.continue, 'pop');
        this.checked = true;
    }

    uncheck() {
        removeClass(this.checkbox, 'checked');
        removeClass(this.continue, 'pop');
        this.checked = false;
    }

    isChecked() {
        if (this.checked) { return true; }
        else { return false; }
    }
}

export default Consent;