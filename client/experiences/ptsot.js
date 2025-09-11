import Levels from "../pages/levels";
import Page from "../pages/page";
import { addClass, isOverflown, makeDiv, removeClass, wait } from "../utils/dom";
import { easeInOutSine, generateRandomInteger, remap } from "../utils/math";

class SpatialOrientation extends Page {
    constructor(options, callback) {
        super(options, callback);
        this.elements = this.options.elements;
        this.stage = this.options.stage;
        this.answers = this.options.answers ?? [];

        this.content = makeDiv(null, 'page-content ptsot-content pop');
        this.container.append(this.content);

        if (this.stage === 'presentation') {
            let centers = this.app.options.interface.map.start.centers;
            let i = generateRandomInteger(0, centers.length - 1);
            this.basemap.fly({
                easing: easeInOutSine,
                center: centers[i],
                zoom: this.app.options.interface.map.start.zoom
            }, () => {
                this.createPresentation();
            });
        }
        else {
            this.topcontent = makeDiv(null, 'experience-content top pop');
            this.back = makeDiv(null, 'page-button page-button-back', 'Retour');
            this.toptext = makeDiv(null, 'experience-text top pop');
            this.topcontent.append(this.back, this.toptext);

            this.bottomcontent = makeDiv(null, 'experience-content bottom pop');
            this.continue = makeDiv(null, 'page-button page-button-continue', 'Continuer');
            this.bottomtext = makeDiv(null, 'experience-text bottom pop');
            this.bottomcontent.append(this.bottomtext, this.continue);

            this.content.append(this.topcontent, this.bottomcontent);

            if (this.stage === 'characters') {
                this.createCharacters();
            }
        }
    }

    createPresentation() {
        let back = makeDiv(null, 'page-button page-button-back', 'Retour');
        let pursue = makeDiv(null, 'page-button page-button-continue', 'Continuer');

        let text = makeDiv(null, 'experience-text');
        this.content.append(back, text, pursue);
        this.content.offsetWidth;

        let presentation = makeDiv(null, 'experience-presentation');
        this.elements.presentation.forEach(t => {
            presentation.append(makeDiv(null, 'experience-presentation-paragraph', t));
        });
        text.append(presentation);

        addClass(text, 'pop');
        wait(300, () => {
            addClass(back, 'pop');
            addClass(pursue, 'pop');

            back.addEventListener('click', () => {
                removeClass(this.content, 'pop');
                wait(500, () => {
                    this.destroy();
                    this.basemap.fit(this.params.interface.map.levels, {
                        easing: easeInOutSine
                    }, () => {
                        this.app.page = new Levels({ app: this.app, position: 'current' });
                    });
                });
            }, { once: true });

            pursue.addEventListener('click', () => {
                let o = this.options;
                o.stage = 'characters';
                o.position = 'next';
                o.answers = this.answers;
                this.next = new SpatialOrientation(o);
                this.slideNext();
            }, { once: true })
        });
    }

    createCharacters() {
        let characters = this.generateCharacters('characters');
        this.toptext.append(characters);

        let names = this.generateCharacters('names');
        this.bottomtext.append(names);

        let bottom = makeDiv(null, 'ptsot-characters-text bottom', this.elements.characters.bottom);
        this.bottomtext.append(bottom);

        wait(this.app.options.interface.transition.page, () => {
            addClass(this.back, 'pop');
            addClass(this.continue, 'pop');
        });
    }

    generateCharacters(type) {
        let container = makeDiv(null, 'ptsot-characters-container');
        // let characters = makeDiv(null, 'ptsot-characters');

        for (let [c, infos] of Object.entries(this.elements.characters.list)) {
            if (type === 'characters') {
                let character = makeDiv(null, 'ptsot-characters-character hidden ' + c);
                let image = document.createElement('img');
                image.src = this.params.sprites[`ptsot:${c}`];
                image.alt = infos.name;
                character.append(image);
                character.style.left = infos.coordinates[0] + '%';
                character.style.top = infos.coordinates[1] + '%';
                container.append(character);
            }
            else if (type === 'names') {
                let name = makeDiv(null, 'ptsot-characters-name ' + c, infos.name);
                name.style.left = infos.coordinates[0] + '%';
                name.style.top = infos.coordinates[1] + '%';
                container.append(name);
            }

            let point = makeDiv(null, 'ptsot-characters-point');
            point.style.left = infos.coordinates[0] + '%';
            point.style.top = infos.coordinates[1] + '%';
            container.append(point);
        }

        return container;
    }
}

export default SpatialOrientation;