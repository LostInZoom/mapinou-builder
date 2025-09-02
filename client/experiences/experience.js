import Page from "../pages/page";
import { makeDiv } from "../utils/dom";
import SantaBarbara from "./sbsod";

class Experience extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.name = this.options.name;

        this.addContent('center');

        if (this.name === 'SBSOD') {
            this.exp = new SantaBarbara({ page: this });
        }
    }
}

export default Experience;