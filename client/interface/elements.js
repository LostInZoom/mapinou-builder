import { addClass, removeClass, makeDiv } from "../utils/dom.js";

class ConsentForm {
    constructor(page, container) {
        this.page = page;
        this.container = container;

        let text = `
            I accept that my game data are collected and used by the LostInZoom
            team to analyse the way we navigate inside interactive maps.
            <br><br>
            The following data are collected:<br>
            · Request form answers (sociological and cognitive tests).<br>
            · Game metrics (time elapsed, score).<br>
        `

        this.textContent = makeDiv(null, 'content-text', text);
        this.checkboxcontainer = makeDiv(null, 'checkbox-container');
        this.checked = false;
        this.checkbox = makeDiv(null, 'checkbox ' + this.page.app.params.interface.theme);
        this.checkbox.addEventListener('click', () => { this.checking(); });

        this.checkboxlabel = makeDiv(null, 'checkbox-label', 'I understand.');
        this.checkboxcontainer.append(this.checkbox, this.checkboxlabel);

        this.container.append(this.textContent, this.checkboxcontainer);
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

export { ConsentForm };