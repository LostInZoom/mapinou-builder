class Application {
    constructor(options) {
        this.options = options;

        // Create the DOM Element
        this.container = makeDiv('application', 'application ' + this.params.interface.theme);
        document.body.append(this.container);

        // Boolean to flag if the page is sliding
        this.sliding = false;
        
        // Storage fot the previous page
        this.previous = new Page(this, 'previous');
        // Create the current page
        this.current = new Page(this, 'current');
        // Create the next page
        this.next = new Page(this, 'next');

        this.done = 0;
        this.tutodone = true;

        this.phase2(this.current);
        // this.title(this.current);
    }
}

export default Application;