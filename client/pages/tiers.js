import Basemap from "../cartography/map";
import { addClass, hasClass, makeDiv, wait } from "../utils/dom";
import { LevelEdges } from "../utils/svg";

class Panel {
    constructor(options, callback) {
        this.options = options;
        this.callback = callback ?? function () { };

        this.page = this.options.page;
        this.animate = this.options.animate ?? false;

        this.params = this.page.app.options;
        this.basemap = this.page.basemap;

        // Create the content of the tier or experience
        this.container = makeDiv(null, 'levels-panel-container');
        this.page.container.append(this.container);
    }

    slide(direction) {

    }
}

class TierPanel extends Panel {
    constructor(options, callback) {
        super(options, callback);
        this.tier = this.options.tier;
        this.level = this.options.level;

        const tier = this.page.levels[this.tier];

        this.minimapscontainer = [];
        this.minimaps = [];

        this.svg = new LevelEdges({
            parent: this.container,
            animation: this.animate
        });

        this.observer = new ResizeObserver(() => {
            this.basemap.fit(this.params.interface.map.levels, { duration: 0 });
            this.svg.resize(this.page.getWidth(), this.page.getHeight());
            for (let i = 0; i < this.minimapscontainer.length; i++) {
                let minimap = this.minimapscontainer[i];
                this.minimaps[i].setZoom(this.basemap.getZoom() + 1);
                let p = [parseFloat(minimap.getAttribute('x')), parseFloat(minimap.getAttribute('y'))];
                let px = this.basemap.getPixelAtCoordinates(p);
                minimap.style.left = px[0] + 'px';
                minimap.style.top = px[1] + 'px';
                if (i < this.minimapscontainer.length - 1) { this.svg.moveLineStart(i, px[0], px[1]); }
                if (i > 0) { this.svg.moveLineEnd(i - 1, px[0], px[1]); }
            }
        });

        let delay = 200;
        for (let i = 0; i < tier.content.length; i++) {
            const level = tier.content[i];
            let px = this.basemap.getPixelAtCoordinates(level.target);

            let minimapcontainer = makeDiv(null, 'levels-minimap-container');
            if (!this.animate) { addClass(minimapcontainer, 'pop'); }
            minimapcontainer.setAttribute('x', level.target[0]);
            minimapcontainer.setAttribute('y', level.target[1]);

            let minimap = makeDiv(null, 'levels-minimap');
            let state = makeDiv(null, 'levels-state');

            minimap.append(state);
            minimapcontainer.append(minimap);
            minimapcontainer.style.left = px[0] + 'px';
            minimapcontainer.style.top = px[1] + 'px';
            this.container.append(minimapcontainer);

            if (this.animate) {
                wait(delay, () => {
                    addClass(minimapcontainer, 'pop');
                    if (i === tier.content.length - 1) {
                        this.callback();
                    }
                });
                if (i <= this.level) { delay += 300; }

                wait(delay, () => {
                    if (i < this.level) {
                        let nextpx = this.page.app.basemap.getPixelAtCoordinates(tier.content[i + 1].target);
                        this.svg.addLine(px[0], px[1], nextpx[0], nextpx[1], i, i + 1);
                    }
                });
            } else {
                if (i < this.level) {
                    let nextpx = this.page.app.basemap.getPixelAtCoordinates(tier.content[i + 1].target);
                    this.svg.addLine(px[0], px[1], nextpx[0], nextpx[1], i, i + 1);
                }
                callback();
            }

            if (i > this.level) {
                addClass(minimapcontainer, 'remaining');
                state.innerHTML = this.page.app.options.svgs.lock;
            } else {
                if (i < this.level) {
                    addClass(minimapcontainer, 'finished');
                    state.innerHTML = this.page.app.options.svgs.check;
                }
                if (i === this.level) {
                    addClass(minimapcontainer, 'active');
                }
                delay += 300;
            }

            minimapcontainer.addEventListener('click', () => {
                if (hasClass(minimapcontainer, 'active') && this.listen) {
                    this.hideElements(() => {
                        this.unobserveSize();
                        this.destroy();
                        this.back.remove();
                        this.page.app.page = new Level({
                            app: this.app,
                            levels: this,
                            position: 'current',
                            params: level
                        });
                    });
                }
            });

            this.minimapscontainer.push(minimapcontainer);
            this.minimaps.push(new Basemap({
                app: this.page.app,
                parent: minimap,
                class: 'minimap',
                center: level.target,
                zoom: this.basemap.getZoom() + 1,
                interactive: false
            }));
        }

        this.observer.observe(this.container);
    }

    destroy() {
        this.minimaps.forEach(minimap => { minimap.destroy(); });
    }

    unobserveSize() {
        if (this.observer) this.observer.unobserve(this.container);
    }
}

class ExperiencePanel extends Panel {
    constructor(options, callback) {
        super(options, callback);
        this.test = makeDiv(null, 'levels-test-container');
        this.container.append(this.test);
        this.callback();
    }
}

class TutorialPanel extends Panel {
    constructor(options) {
        super(options);
    }
}

class NavigationBar {
    constructor(options) {
        this.options = options;
        this.page = this.options.page;
        this.params = this.options.page.params;

        // Create the tier navigation bar
        this.container = makeDiv(null, 'levels-tier-container');
        this.previous = makeDiv(null, 'levels-tier-entry previous', this.params.svgs.arrowleft);
        this.current = makeDiv(null, 'levels-tier-entry current', this.page.getTier().name);
        this.next = makeDiv(null, 'levels-tier-entry next', this.params.svgs.arrowright);
        this.container.append(this.previous, this.current, this.next);

        this.page.container.append(this.container);
        this.container.offsetHeight;

        addClass(this.container, 'pop');

        // Listeners to assign to navigation bar buttons
        this.previousListener = () => { this.slide('previous'); };
        this.nextListener = () => { this.slide('next'); };
        this.previous.addEventListener('click', this.previousListener);
        this.next.addEventListener('click', this.nextListener);
    }
}

export { TierPanel, ExperiencePanel, TutorialPanel, NavigationBar };