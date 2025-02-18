import Page from './page.js';
import { makeDiv, addSVG, addClass, hasClass, removeClass, wait } from '../utils/dom.js';
import { GameMap, MenuMap } from '../cartography/map.js';

class Application {
    constructor(params) {
        this.params = params;

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

        this.title(this.current);
    }

    title(page) {
        let title = makeDiv(null, 'title', 'Cartogame');
        let startButton = makeDiv(null, 'button-start button-menu button ' + this.params.interface.theme, 'Play');
        page.container.append(title, startButton);

        let themeButton = makeDiv(null, 'button-theme button', null);
        addSVG(themeButton, new URL('../img/theme.svg', import.meta.url));
        themeButton.addEventListener('click', () => { this.switchTheme(); });
        page.container.append(themeButton);
        page.themed.push(startButton);

        startButton.addEventListener('click', () => {
            if (!this.sliding) {
                this.consent(this.next);
                this.slideNext(() => {
                    this.next = new Page(this, 'next');
                });
            }
        });
    }

    consent(page) {
        let header = makeDiv(null, 'header collapse');
        let content = makeDiv(null, 'content');
        page.container.append(header, content);

        let backButton = makeDiv(null, 'button-back button-menu button ' + this.params.interface.theme, 'Menu');
        let title = makeDiv(null, 'header-title', 'Consent form');
        let themeButton = makeDiv(null, 'button-theme button', null);
        addSVG(themeButton, new URL('../img/theme.svg', import.meta.url));
        themeButton.addEventListener('click', () => { this.switchTheme(); });

        header.append(backButton, title, themeButton);

        let continueButton = makeDiv(null, 'button-content button-menu button ' + this.params.interface.theme, 'Continue');

        let text = `
            I agree to participate in a study which aims at collecting data
            during the navigation wihtin an interactive map.
            The following points have been explained to me:
            The purpose of this research is to study how much people can be lost when exploring an interactive map. I understand that the results of this study may be submitted for publication. The benefits I may expect from the study are:
            An appreciation of research on multi-scale cartography.
            An opportunity to contribute to scientific research.
            An opportunity to learn about the cognition of maps.
            The procedure will be as follow:
            I will first be given a step-by-step tutorial of a training application interface.
            The researchers do not foresee any risks to me for participating in this study, nor do they expect that I will experience any discomfort or stress.
            I understand that I may withdraw from the study at any time.
            I understand that I will receive a copy of this consent form if requested.
            All of the data collected will remain strictly anonymized. My responses will not be associated with my name or email; instead, only a code number will be used when the researchers store the data. The anonymized data may then be made accessible for other researchers according to the principles of open science.
            This study respects the GDPR legislation (contact dpo@ign.fr for questions related to GDPR).
            For any questions about the study or the LostInZoom project, you can contact Guillaume Touya.
            You must be overage to participate.
            You can access the full information sheet concerning the experiment here
        `

        let textContent = makeDiv(null, 'content-text', text);

        let checkboxcontainer = makeDiv(null, 'checkbox-container');
        let consented = false;
        let checkbox = makeDiv(null, 'checkbox ' + this.params.interface.theme);
        checkbox.addEventListener('click', () => {
            if (consented) {
                removeClass(checkbox, 'checked');
                consented = false;
            } else {
                addClass(checkbox, 'checked');
                consented = true;
            }
        })

        let checkboxlabel = makeDiv(null, 'checkbox-label', 'I understand.');
        checkboxcontainer.append(checkbox, checkboxlabel);

        content.append(textContent, checkboxcontainer, continueButton);
        page.themed.push(backButton, continueButton, checkbox);

        continueButton.addEventListener('click', () => {
            if (consented) {
                if (!this.sliding) {
                    this.page2(this.next);
                    this.slideNext(() => {
                        this.next = new Page(this, 'next');
                    });
                }
            }
        });

        backButton.addEventListener('click', () => {
            if (!this.sliding) {
                this.title(this.previous);
                this.slidePrevious(() => {
                    this.previous = new Page(this, 'previous');
                });
            }
        });
    }

    page2(page) {
        let backButton = makeDiv(null, 'button-back button-menu button ' + this.params.interface.theme, 'Menu');
        page.container.append(backButton);
        page.themed.push(backButton);

        let themeButton = makeDiv(null, 'button-theme button', null);
        addSVG(themeButton, new URL('../img/theme.svg', import.meta.url));
        themeButton.addEventListener('click', () => { this.switchTheme(); });
        page.container.append(themeButton);

        let tutorialButton = makeDiv(null, 'button-level button-menu button ' + this.params.interface.theme, 'Tutorial');
        page.container.append(tutorialButton);
        page.themed.push(tutorialButton);

        let levelcontainer = makeDiv(null, 'level-selection');
        page.container.append(levelcontainer);

        let levels = this.params.levels;
        for (let i = 0; i < levels.length; i++) {
            let levelbutton = makeDiv(null, 'button-level button-menu button ' + this.params.interface.theme, i + 1);
            levelcontainer.append(levelbutton);
            levelbutton.addEventListener('click', () => {
                if (!this.sliding) {
                    this.startGame(this.next, i);
                    this.slideNext(() => {
                        this.next = new Page(this, 'next');
                    });
                }
            });
            page.themed.push(levelbutton);
        }

        tutorialButton.addEventListener('click', () => {
            if (!this.sliding) {
                this.tutorial2(this.next);
                this.slideNext(() => {
                    this.next = new Page(this, 'next');
                });
            }
        });

        backButton.addEventListener('click', () => {
            if (!this.sliding) {
                this.consent(this.previous);
                this.slidePrevious(() => {
                    this.previous = new Page(this, 'previous');
                });
            }
        });
    }

    tutorial1(page) {
        addClass(page.container, 'tutorial');
        
        let menumap = new MenuMap(page);
        menumap.layers.add('player', 50);
        menumap.map.addLayer(menumap.layers.getLayer('player'));

        menumap.setCenter(this.params.tutorial.player);
        menumap.setZoom(16);
        menumap.setGeometry('player', this.params.tutorial.player);

        let information = makeDiv(null, 'tutorial-information');
        let title = makeDiv(null, 'tutorial-title', 'Phase 1');

        let text = makeDiv(null, 'tutorial-text', `
            You must find your location on the map
            following the information on screen.<br><br>
            Hints are updated during the search if you
            are heading in the right direction.<br><br>
            Double tap on the screen when you have found the location,
            a visual let you know if you're wrong.
            `)

        let continueButton = makeDiv(null, 'button-menu button ' + this.params.interface.theme, 'Try it now!');
        information.append(title, text, continueButton);
        page.container.append(information);

        continueButton.addEventListener('click', () => {
            if (!this.sliding) {
                this.phase1(this.next);
                this.slideNext(() => {
                    this.next = new Page(this, 'next');
                });
            }
        });
    }

    phase1(page) {
        let gamemap = new GameMap(page);
        gamemap.setCenter(this.params.tutorial.start.center);
        gamemap.setZoom(this.params.tutorial.start.zoom);
    }

    tutorial2(page) {
        addClass(page.container, 'tutorial');
        let menumap = new MenuMap(page);

        menumap.layers.add('player', 50);
        menumap.map.addLayer(menumap.layers.getLayer('player'));
        menumap.setGeometry('player', this.params.tutorial.player);

        menumap.layers.add('target', 51);
        menumap.map.addLayer(menumap.layers.getLayer('target'));
        menumap.setGeometry('target', this.params.tutorial.target);

        menumap.layers.add('pitfalls', 49);
        menumap.map.addLayer(menumap.layers.getLayer('pitfalls'));
        for (let i = 0; i < this.params.tutorial.pitfalls.length; i++) {
            let p = this.params.tutorial.pitfalls[i];
            menumap.addPoint('pitfalls', p);
        }

        menumap.setCenter(menumap.getCenterForData());
        menumap.setZoom(menumap.getZoomForData(20));

        let information = makeDiv(null, 'tutorial-information');
        let title = makeDiv(null, 'tutorial-title', 'Phase 2 - The journey');

        let text = makeDiv(null, 'tutorial-text', `
            Now that you found your location on the map, you must travel to your
            destination (in green) while avoiding pitfalls (in red) on the way.
            `)

        let continueButton = makeDiv(null, 'button-menu button ' + this.params.interface.theme, 'Continue');
        information.append(title, text, continueButton);
        page.container.append(information);

        continueButton.addEventListener('click', () => {
            if (!this.sliding) {
                this.tutorial3(this.next);
                this.slideNext(() => {
                    this.next = new Page(this, 'next');
                });
            }
        });
    }

    tutorial3(page) {
        addClass(page.container, 'tutorial');
        let menumap = new MenuMap(page);

        let information = makeDiv(null, 'tutorial-information');
        let title = makeDiv(null, 'tutorial-title', 'Phase 2 - The journey');

        let text = makeDiv(null, 'tutorial-text', `
            Now that you found your location on the map, you must travel to your
            destination (in green) while avoiding pitfalls (in red) on the way.
            `)

        let continueButton = makeDiv(null, 'button-menu button ' + this.params.interface.theme, 'Continue');
        information.append(title, text, continueButton);
        page.container.append(information);

        continueButton.addEventListener('click', () => {
            if (!this.sliding) {
                this.page2(this.next);
                this.slideNext(() => {
                    this.next = new Page(this, 'next');
                });
            }
        });

        menumap.layers.add('player', 50);
        menumap.map.addLayer(menumap.layers.getLayer('player'));
        menumap.setGeometry('player', this.params.tutorial.player);

        menumap.layers.add('pitfallsArea', 49);
        menumap.map.addLayer(menumap.layers.getLayer('pitfallsArea'));
        for (let i = 0; i < this.params.tutorial.pitfalls.length; i++) {
            if (i > 1) { break; }
            let p = this.params.tutorial.pitfalls[i];
            menumap.addZone('pitfallsArea', p, this.params.game.tolerance.pitfall);
        }

        menumap.setCenter(menumap.getCenterForData());
        menumap.setZoom(menumap.getZoomForData(30));
    }

    phase2(page) {
        let gamemap = new GameMap(page);
        gamemap.setCenter(this.params.tutorial.start.center);
        gamemap.setZoom(this.params.tutorial.start.zoom);

        gamemap.doubleClick(() => {
            
        });
    }

    startGame(page, index) {
        let options = this.params.levels[index]
        let gamemap = new GameMap(page, options);
        // gamemap.phase1(() => {
        //     gamemap.phase2(() => {

        //     });
        // });
        gamemap.phase2(() => {

        });
    }

    getTheme() {
        if (hasClass(this.container, 'theme-dark')) { return 'theme-dark' }
        else { return 'theme-light' }
    }

    switchTheme() {
        if ( this.getTheme() === 'theme-dark' ) { this.light(); }
        else { this.dark(); }
    }

    light() {
        removeClass(this.container, 'theme-dark');
        addClass(this.container, 'theme-light');
        this.previous.light();
        this.current.light();
        this.next.light();
        this.params.interface.theme = 'theme-light';
    }

    dark() {
        removeClass(this.container, 'theme-light');
        addClass(this.container, 'theme-dark');
        this.previous.dark();
        this.current.dark();
        this.next.dark();
        this.params.interface.theme = 'theme-dark';
    }

    slideNext(callback) {
        if (!this.sliding) {
            this.sliding = true;

            this.next.setCurrent();
            this.current.setPrevious();

            this.previous = this.current;
            this.current = this.next;

            wait(this.params.interface.transition.page, () => {
                this.previous.clear();
                this.container.firstChild.remove();
                this.sliding = false;
                callback();
            })
        }
    }

    slidePrevious(callback) {
        this.sliding = true;

        this.previous.setCurrent();
        this.current.setNext();
        
        this.next = this.current;
        this.current = this.previous;

        wait(this.params.interface.transition.page, () => {
            this.next.clear();
            this.container.lastChild.remove();
            this.sliding = false;
            callback();
        })
    }
}

export default Application;