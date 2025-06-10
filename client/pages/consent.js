import { addClass } from "../utils/dom";
import Page from "./page";

class Consent extends Page {
    constructor(app, position) {
        super(app, position);
        addClass(this.container, 'page-consent');

        this.addHeader('right');
    }
}

export default Consent;