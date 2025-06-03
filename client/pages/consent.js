import Page from "./page";

class Consent extends Page {
    constructor(app, position) {
        super(app, position);

        this.addHeader('right');
    }
}

export default Consent;