import Page from "../pages/page";
import { makeDiv } from "../utils/dom";
import SantaBarbara from "./sbsod";

class Experience extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.elements = this.options.elements;
        this.name = this.elements.index;

        this.experiences = ['piaget', 'purdue', 'SBSOD', 'PTSOT'];

        if (this.name === 'SBSOD') {
            this.exp = new SantaBarbara({
                page: this,
                elements: this.elements
            });
        }
    }
}

export default Experience;