import Roamer from "./roamer.js";

class Target extends Roamer {
    constructor(options) {
        super(options);
        this.target = true;
        this.weights = [1, 2, 5];
        this.statespool = ['move', 'graze', 'idle'];

        this.radius = this.params.game.tolerance.target;
        this.roam();
    }
}

export default Target;