import Score from "../cartography/score";
import Page from "../pages/page";

class Level extends Page {
    constructor(options, callback) {
        super(options, callback);

        this.phase = 1;

        let appOptions = this.options.app.options;

        this.score = new Score({
            parent: this.container,
            increment: appOptions.game.score.increment.default,
            refresh: appOptions.game.score.refresh.default
        });
        this.score.start();
    }
}

export default Level;