import * as turf from "@turf/turf";

import { Eagle, Hunter, Snake } from "../characters/enemy";
import Helper from "../characters/helper";
import Player from "../characters/player";
import Rabbit from "../characters/rabbit";
import Enemies from "../layers/enemies";
import Helpers from "../layers/helpers";
import Rabbits from "../layers/rabbits";
import { addClass, addClassList, hasClass, makeDiv, removeClass, removeClassList, wait } from "../utils/dom";

class Builder {
    constructor(options) {
        this.options = options;
        this.app = this.options.app;
        this.params = this.app.options;
        this.basemap = this.options.basemap;

        this.mode = undefined;
        this.remove = false;
        this.modeEnemies = 'snake';

        this.player = undefined;
        this.target = undefined;

        this.container = makeDiv(null, 'builder-container');
        this.app.container.append(this.container);

        this.createLayers();

        this.createTopMenu();
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

        let clearcontainer = makeDiv(null, 'builder-clear-container');
        let clear = makeDiv(null, 'builder-top-button builder-clear pop', this.params.svgs.cross);
        let remove = makeDiv(null, 'builder-top-button builder-remove pop', this.params.svgs.trash);
        clearcontainer.append(clear, remove);

        let zoom = makeDiv(null, 'builder-zoom');
        let play = makeDiv(null, 'builder-top-button builder-play', this.params.svgs.play);
        this.topmenu.append(clearcontainer, zoom, play);

        this.container.append(this.topmenu);

        const zoomListener = () => { zoom.innerHTML = this.basemap.getZoom().toFixed(2); };
        this.basemap.addListener('render', zoomListener);

        remove.addEventListener('click', () => {
            if (!hasClass(remove, 'active')) {
                addClass(remove, 'active');
                this.remove = true;
            } else {
                removeClass(remove, 'active');
                this.remove = false;
            }
        });

        clear.addEventListener('click', () => {
            let cleared = 0;
            const clearing = 3;

            const checkDone = () => {
                if (++cleared === clearing) {
                    wait(300, () => {
                        this.rabbits.destroy();
                        this.helpers.destroy();
                        this.enemies.destroy();
                    });
                };
            };

            const tasks = [
                this.rabbits ? (cb) => this.rabbits.despawnCharacters(cb) : null,
                this.enemies ? (cb) => {
                    this.enemies.hideAreas();
                    this.enemies.despawnCharacters(cb);
                } : null,
                this.helpers ? (cb) => this.helpers.despawnCharacters(cb) : null,
            ];

            tasks.forEach(task => task ? task(checkDone) : checkDone());
        });
    }

    createBottomMenu() {
        this.bottommenu = makeDiv(null, 'builder-menu-bottom');

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
    }

    activateListeners() {
        let removeTolerance = 30;

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
                            let closest = this.enemiesLayer.getCharacter(0);
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
                        if (this.player !== undefined) {
                            let tmp = this.player;
                            tmp.despawn(() => { tmp.destroy(); })
                        }
                        let player = new Rabbit({
                            layer: this.rabbits,
                            color: 'white',
                            coordinates: t
                        });
                        player.spawn();
                        this.player = player;
                    }
                    // TARGET
                    else if (this.mode === 'target') {
                        if (this.target !== undefined) {
                            let tmp = this.target;
                            tmp.despawn(() => { tmp.destroy(); })
                        }
                        let target = new Rabbit({
                            layer: this.rabbits,
                            color: 'brown',
                            coordinates: t
                        });
                        target.spawn();
                        this.target = target;
                    }
                    // ENEMIES
                    else if (this.mode === 'enemies') {
                        if (this.modeEnemies === 'hunter') {
                            let hunter = new Hunter({
                                layer: this.enemies,
                                coordinates: t
                            });
                            hunter.spawn();
                            hunter.revealArea();
                        } else if (this.modeEnemies === 'eagle') {
                            let eagle = new Eagle({
                                layer: this.enemies,
                                coordinates: t
                            });
                            eagle.spawn();
                            eagle.revealArea();
                        } else if (this.modeEnemies === 'snake') {
                            let snake = new Snake({
                                layer: this.enemies,
                                coordinates: t
                            });
                            snake.spawn();
                            snake.revealArea();
                        }
                    }
                    // HELPERS
                    else if (this.mode === 'helpers') {
                        let helper = new Helper({
                            layer: this.helpers,
                            coordinates: t
                        });
                        helper.reveal();
                        helper.spawn();
                    }
                }
            }
        }
        this.basemap.addListener('click', this.listener);
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