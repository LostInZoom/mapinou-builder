import * as turf from "@turf/turf";
import yaml from "js-yaml";

import { Eagle, Hunter, Snake } from "../characters/enemy";
import Helper from "../characters/helper";
import Rabbit from "../characters/rabbit";
import Enemies from "../layers/enemies";
import Helpers from "../layers/helpers";
import Rabbits from "../layers/rabbits";
import { addClass, addClassList, hasClass, makeDiv, removeClass, removeClassList, wait } from "../utils/dom";
import Level from "./level";
import { mergeExtents } from "../cartography/analysis";
import { easeInOutSine } from "../utils/math";

class Builder {
    constructor(options) {
        this.options = options;
        this.app = this.options.app;
        this.params = this.app.options;
        this.basemap = this.options.basemap;

        this.basemap.enableInteractions();

        this.mode = undefined;
        this.remove = false;
        this.modeEnemies = 'snake';
        this.hints = {};

        this.player = undefined;
        this.target = undefined;

        this.container = makeDiv(null, 'builder-container');
        this.app.container.append(this.container);

        this.dragindicator = makeDiv(null, 'builder-drag-indicator', 'Déposez un fichier YAML pour charger une partie.');
        this.container.append(this.dragindicator);

        this.createLayers();

        let game = this.app.currentGame;
        if (game) {
            if (game.player) { this.createPlayer(game.player); }
            if (game.target) { this.createTarget(game.target); }
            if (game.helpers) {
                game.helpers.forEach(h => { this.createHelper(h); });
            }
            if (game.enemies) {
                game.enemies.forEach(e => { this.createEnemy(e.type, e.coordinates); });
            }

            let extents = [];
            if (this.rabbits) {
                let re = this.rabbits.getLayerExtent();
                if (re != null) extents.push(re);
            }
            if (this.enemies) {
                let ee = this.enemies.getLayerExtent();
                if (ee != null) extents.push(ee);
            }
            if (this.helpers) {
                let he = this.helpers.getLayerExtent();
                if (he != null) extents.push(he);
            }
            extents = mergeExtents(extents);

            this.basemap.fit(extents, {
                easing: easeInOutSine,
                padding: 100
            }, () => {

            });
        }

        this.createTopMenu();
        this.createLeftMenu();
        this.createBottomMenu();
        this.activateListeners();
    }

    createLayers() {
        this.enemies = new Enemies({
            id: 'enemies',
            basemap: this.basemap,
        });

        this.helpers = new Helpers({
            id: 'helpers',
            basemap: this.basemap,
        });

        this.rabbits = new Rabbits({
            id: 'rabbits',
            basemap: this.basemap,
        });
    }

    createTopMenu() {
        this.topmenu = makeDiv(null, 'builder-menu-top');

        this.topleft = makeDiv(null, 'builder-top-container left hidden');
        this.clearButton = makeDiv(null, 'builder-top-button builder-clear pop', this.params.svgs.cross);
        this.deleteButton = makeDiv(null, 'builder-top-button builder-remove pop', this.params.svgs.trash);
        this.topleft.append(this.clearButton, this.deleteButton);

        this.zoom = makeDiv(null, 'builder-zoom hidden', this.basemap.getZoom().toFixed(2));

        this.topright = makeDiv(null, 'builder-top-container right hidden')
        this.downloadButton = makeDiv(null, 'builder-top-button builder-download', this.params.svgs.download);
        this.playButton = makeDiv(null, 'builder-top-button builder-play', this.params.svgs.play);
        this.topright.append(this.downloadButton, this.playButton);

        this.topmenu.append(this.topleft, this.zoom, this.topright);
        this.container.append(this.topmenu);
        this.container.offsetWidth;

        if (this.player && this.target) {
            addClass(this.playButton, 'pop');
            addClass(this.downloadButton, 'pop');
        }

        removeClassList([this.topleft, this.zoom, this.topright], 'hidden');

        const zoomListener = () => { this.zoom.innerHTML = this.basemap.getZoom().toFixed(2); };
        this.basemap.addListener('render', zoomListener);

        this.deleteButton.addEventListener('click', () => {
            if (!hasClass(remove, 'active')) {
                addClass(remove, 'active');
                this.remove = true;
            } else {
                removeClass(remove, 'active');
                this.remove = false;
            }
        });

        this.clearButton.addEventListener('click', () => {
            this.clearGame();
        });

        this.downloadButton.addEventListener('click', () => {
            let game = this.createGame();

            const yamlText = yaml.dump(game);
            const blob = new Blob([yamlText], { type: "application/x-yaml;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = 'game.yml';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 500);
        });

        this.playButton.addEventListener('click', () => {
            this.app.currentGame = this.createGame();
            this.clearGame(() => {
                addClassList([this.topleft, this.zoom, this.topright, this.leftmenu, this.bottommenu], 'hidden');
                wait(300, () => {
                    this.container.remove();
                    this.basemap.removeListeners();

                    this.app.page = new Level({
                        app: this.app,
                        position: 'current',
                        parameters: this.app.currentGame
                    });
                });
            });
        });
    }

    createLeftMenu() {
        this.leftmenu = makeDiv(null, 'builder-hint-container hidden');
        this.hintselements = makeDiv(null, 'builder-hints')
        let buttonhint = makeDiv(null, 'builder-hint-add', this.params.svgs.hint);

        this.leftmenu.append(buttonhint, this.hintselements);
        this.container.append(this.leftmenu);

        buttonhint.addEventListener('click', () => { this.createHint(); });

        this.container.offsetWidth;
        removeClass(this.leftmenu, 'hidden');
    }

    createBottomMenu() {
        this.bottommenu = makeDiv(null, 'builder-menu-bottom hidden');

        let eimages = {
            'hunter': this.params.sprites[`enemies:hunter_idle_south_0`],
            'eagle': this.params.sprites[`enemies:bird_idle_south_1`],
            'snake': this.params.sprites[`enemies:snake_idle_south_0`]
        }

        let player = makeDiv(null, 'builder-bottom-button builder-player');
        player.setAttribute('value', 'player');

        let target = makeDiv(null, 'builder-bottom-button builder-target');
        target.setAttribute('value', 'target');

        let enemies = makeDiv(null, 'builder-bottom-button builder-enemies');
        enemies.setAttribute('value', 'enemies');

        let helpers = makeDiv(null, 'builder-bottom-button builder-helpers');
        helpers.setAttribute('value', 'helpers');

        this.bottommenu.append(player, target, enemies, helpers);

        let playerimage = document.createElement('img');
        playerimage.src = this.params.sprites[`rabbits:white_idle_east_0`];
        player.append(playerimage);

        let targetimage = document.createElement('img');
        targetimage.src = this.params.sprites[`rabbits:brown_idle_east_0`];
        target.append(targetimage);

        let enemiesimage = document.createElement('img');
        enemiesimage.src = this.params.sprites[`enemies:snake_idle_south_0`];
        enemies.append(enemiesimage);

        let helpersimage = document.createElement('img');
        helpersimage.src = this.params.sprites[`vegetables:leek`];
        helpers.append(helpersimage);

        let enemiesmenu = makeDiv(null, 'builder-menu-enemies');

        let snake = makeDiv(null, 'builder-bottom-button builder-snake enemies active');
        snake.setAttribute('value', 'snake');

        let snakeimage = document.createElement('img');
        snakeimage.src = eimages.snake;
        snake.append(snakeimage);

        let eagle = makeDiv(null, 'builder-bottom-button builder-eagle enemies');
        eagle.setAttribute('value', 'eagle');

        let eagleimage = document.createElement('img');
        eagleimage.src = eimages.eagle;
        eagle.append(eagleimage);

        let hunter = makeDiv(null, 'builder-bottom-button builder-hunter enemies');
        hunter.setAttribute('value', 'hunter');

        let hunterimage = document.createElement('img');
        hunterimage.src = eimages.hunter;
        hunter.append(hunterimage);

        enemiesmenu.append(snake, eagle, hunter);
        enemies.append(enemiesmenu);

        this.container.append(this.bottommenu);
        this.enemiesbuttons = [snake, eagle, hunter];
        this.modebuttons = [player, target, enemies, helpers];
        addClassList(this.modebuttons, 'pop');

        const selectMode = (e) => {
            const value = e.target.getAttribute('value');
            if (['snake', 'eagle', 'hunter'].includes(value)) {
                if (!hasClass(e.target, 'active')) {
                    removeClassList(this.enemiesbuttons, 'active');
                    addClass(e.target, 'active');
                    enemiesimage.src = eimages[value];
                    this.modeEnemies = value;
                }
            } else {
                if (!hasClass(e.target, 'active')) {
                    removeClassList(this.modebuttons, 'active');
                    addClass(e.target, 'active');
                    this.mode = value;
                    if (value === 'enemies') {
                        addClassList(this.enemiesbuttons, 'pop');
                    } else {
                        removeClassList(this.enemiesbuttons, 'pop');
                    }
                } else {
                    if (value === 'enemies') {
                        removeClassList(this.enemiesbuttons, 'pop');
                    }
                    removeClass(e.target, 'active');
                    this.mode = undefined;
                }
            }
        };

        player.addEventListener('click', selectMode);
        target.addEventListener('click', selectMode);
        enemies.addEventListener('click', selectMode);
        helpers.addEventListener('click', selectMode);
        this.container.offsetWidth;

        removeClass(this.bottommenu, 'hidden');
    }

    activateListeners() {
        let removeTolerance = 50;

        this.listener = (e) => {
            let t = e.lngLat.toArray();
            if (this.remove) {
                if (this.mode !== undefined) {
                    if (this.mode === 'player') {
                        if (this.player) {
                            let tmp = this.player;
                            tmp.despawn(() => { tmp.destroy(); });
                            this.player = undefined;
                        }
                    } else if (this.mode === 'target') {
                        if (this.target) {
                            let tmp = this.target;
                            tmp.despawn(() => { tmp.destroy(); });
                            this.target = undefined;
                        }
                    } else if (this.mode === 'enemies') {
                        if (this.enemies.getNumber() > 0) {
                            this.enemies.orderByDistance(t);
                            let closest = this.enemies.getCharacter(0);
                            let distance = this.distanceInPixels(closest.getCoordinates(), t);
                            if (distance < removeTolerance) {
                                closest.despawn(() => { closest.destroy(); });
                                closest.hideArea();
                            }
                        }
                    } else if (this.mode === 'helpers') {
                        if (this.helpers.getNumber() > 0) {
                            this.helpers.orderByDistance(t);
                            let closest = this.helpers.getCharacter(0);
                            let distance = this.distanceInPixels(closest.getCoordinates(), t);
                            if (distance < removeTolerance) {
                                closest.despawn(() => { closest.destroy(); });
                            }
                        }
                    }
                }
            } else {
                if (this.mode !== undefined) {
                    // PLAYER
                    if (this.mode === 'player') {
                        this.createPlayer(t);
                    }
                    // TARGET
                    else if (this.mode === 'target') {
                        this.createTarget(t);
                    }
                    // ENEMIES
                    else if (this.mode === 'enemies') {
                        this.createEnemy(this.modeEnemies, t);
                    }
                    // HELPERS
                    else if (this.mode === 'helpers') {
                        this.createHelper(t);
                    }
                }
            }

            if (this.player && this.target) {
                addClass(this.playButton, 'pop');
                addClass(this.downloadButton, 'pop');
            } else {
                removeClass(this.playButton, 'pop');
                removeClass(this.downloadButton, 'pop');
            }
        }
        this.basemap.addListener('click', this.listener);

        this.basemap.container.addEventListener('dragenter', (e) => {
            e.stopPropagation();
            e.preventDefault();
            addClass(this.dragindicator, 'active');
        });
        this.basemap.container.addEventListener('dragleave', (e) => {
            removeClass(this.dragindicator, 'active');
        });
        this.basemap.container.addEventListener('dragover', (e) => {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
    }

    createPlayer(coordinates) {
        if (this.player !== undefined) {
            let tmp = this.player;
            tmp.despawn(() => { tmp.destroy(); })
        }
        let player = new Rabbit({
            layer: this.rabbits,
            color: 'white',
            coordinates: coordinates
        });
        player.spawn();
        this.player = player;
    }

    createTarget(coordinates) {
        if (this.target !== undefined) {
            let tmp = this.target;
            tmp.despawn(() => { tmp.destroy(); })
        }
        let target = new Rabbit({
            layer: this.rabbits,
            color: 'brown',
            coordinates: coordinates
        });
        target.spawn();
        this.target = target;
    }

    createEnemy(type, coordinates) {
        if (type === 'hunter') {
            let hunter = new Hunter({
                layer: this.enemies,
                coordinates: coordinates
            });
            hunter.spawn();
            hunter.revealArea();
        } else if (type === 'eagle') {
            let eagle = new Eagle({
                layer: this.enemies,
                coordinates: coordinates
            });
            eagle.spawn();
            eagle.revealArea();
        } else if (type === 'snake') {
            let snake = new Snake({
                layer: this.enemies,
                coordinates: coordinates
            });
            snake.spawn();
            snake.revealArea();
        }
    }

    createHelper(coordinates) {
        let helper = new Helper({
            layer: this.helpers,
            coordinates: coordinates
        });
        helper.reveal();
        helper.spawn();
    }

    createHint() {
        let zoom = Math.round(this.basemap.getZoom());
        let already = false;
        for (let key in this.hints) { if (parseInt(key) === parseInt(zoom)) { already = true; break; } }
        if (!already) {
            let hint = makeDiv(null, 'builder-hint-level collapse', zoom);
            hint.setAttribute('value', zoom);
            let before;
            for (let i = 0; i < this.hintselements.children.length; ++i) {
                if (parseInt(this.hintselements.children[i].getAttribute('value')) < zoom) {
                    before = this.hintselements.children[i];
                    break;
                }
            }
            if (before !== undefined) { this.hintselements.insertBefore(hint, before); }
            else { this.hintselements.append(hint); }
            wait(10, () => { removeClass(hint, 'collapse'); });
            this.hints[zoom] = '';

            hint.addEventListener('click', () => {
                this.modifyHint(zoom, hint);
            });

            this.modifyHint(zoom, hint);
        }
    }

    modifyHint(zoom, container) {
        let text = this.hints[zoom];
        let mask = makeDiv(null, 'builder-mask active');
        let modifycontainer = makeDiv(null, 'builder-modify-container collapse');
        let modifylabel = makeDiv(null, 'builder-modify-label', `
                Afficher l'indice suivant à partir du zoom ${zoom} :
            `)
        let input = makeDiv(null, 'builder-modify-input', text);
        input.setAttribute('contenteditable', true);
        let buttons = makeDiv(null, 'builder-modify-buttons');
        let validate = makeDiv(null, 'builder-modify-button', 'Valider');
        let cancel = makeDiv(null, 'builder-modify-button', 'Annuler');
        let remove = makeDiv(null, 'builder-modify-button', 'Supprimer');
        buttons.append(cancel, validate, remove);
        modifycontainer.append(modifylabel, input, buttons);

        this.container.append(mask, modifycontainer);
        this.container.offsetWidth;

        removeClass(modifycontainer, 'collapse');
        input.selectionStart = input.selectionEnd = input.innerHTML.length - 1;
        input.focus();

        cancel.addEventListener('click', () => {
            addClass(modifycontainer, 'collapse');
            mask.remove();
        });
        validate.addEventListener('click', () => {
            let str = input.innerHTML;
            this.hints[zoom] = str.replace(/\s+$/, '').replace('<br>', '');
            addClass(modifycontainer, 'collapse');
            mask.remove();
        });
        remove.addEventListener('click', () => {
            delete this.hints[zoom];
            addClass(modifycontainer, 'collapse');
            addClass(container, 'collapse');
            mask.remove();
            wait(100, () => {
                container.remove();
            });
        });

    }

    createGame() {
        let enemies = [];
        this.enemies.getCharacters().forEach(e => {
            enemies.push({
                type: e.getType(),
                coordinates: e.getCoordinates()
            });
        });

        let helpers = [];
        this.helpers.getCharacters().forEach(h => {
            helpers.push(h.getCoordinates());
        });

        let minzoom = Math.min(parseInt(Object.keys(this.hints)));
        let value = this.hints[minzoom];
        delete this.hints[minzoom];
        this.hints['0'] = value;

        return {
            player: this.player.getCoordinates(),
            target: this.target.getCoordinates(),
            hints: this.hints,
            enemies: enemies,
            helpers: helpers
        }
    }

    clearGame(callback) {
        callback = callback || function () { };

        let cleared = 0;
        const clearing = 3;

        const checkDone = () => {
            if (++cleared === clearing) {
                this.rabbits.destroy();
                this.helpers.destroy();
                this.enemies.destroy();
                callback();
            };
        };

        removeClass(this.playButton, 'pop');
        removeClass(this.downloadButton, 'pop');
        Array.from(this.hintselements.children).forEach((element) => {
            addClass(element, 'collapse');
            wait(100, () => { element.remove(); })
        });
        this.hints = {};

        const tasks = [
            this.rabbits ? (cb) => this.rabbits.despawnCharacters(cb) : null,
            this.enemies ? (cb) => {
                this.enemies.hideAreas();
                this.enemies.despawnCharacters(cb);
            } : null,
            this.helpers ? (cb) => this.helpers.despawnCharacters(cb) : null
        ];

        tasks.forEach(task => task ? task(checkDone) : checkDone());
    }

    distanceInPixels(coord1, coord2) {
        const p1 = this.basemap.map.project(coord1);
        const p2 = this.basemap.map.project(coord2);
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

export default Builder;