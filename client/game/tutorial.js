import Page from "../pages/page";

class Tutorial extends Page {
    constructor(options, callback) {
        super(options, callback);
        console.log(options);
    }
}

export default Tutorial;