import { Eagle, Hunter, Snake } from "../characters/enemy";
import Helper from "../characters/helper";
import Player from "../characters/player";
import Rabbit from "../characters/rabbit";
import Enemies from "../layers/enemies";
import Helpers from "../layers/helpers";
import Rabbits from "../layers/rabbits";
import { addClass, addClassList, hasClass, makeDiv, removeClass, removeClassList } from "../utils/dom";

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
        this.enemies = [];
        this.helpers = [];

        this.container = makeDiv(null, 'builder-container');
        this.app.container.append(this.container);

        this.createLayers();

        this.createTopMenu();
        this.createBottomMenu();
        this.activateListeners();
    }

    createLayers() {
        this.enemiesLayer = new Enemies({
            id: 'enemies',
            basemap: this.basemap,
        });

        this.helpersLayer = new Helpers({
            id: 'helpers',
            basemap: this.basemap,
        });

        this.rabbitsLayer = new Rabbits({
            id: 'rabbits',
            basemap: this.basemap,
        });
    }

    createTopMenu() {

    }

    createBottomMenu() {
        this.bottommenu = makeDiv(null, 'builder-menu-bottom');

        let eimages = {
            'hunter': this.params.sprites[`enemies:hunter_idle_south_0`],
            'eagle': this.params.sprites[`enemies:bird_idle_south_1`],
            'snake': this.params.sprites[`enemies:snake_idle_south_0`]
        }

        let player = makeDiv(null, 'builder-menu-button builder-player');
        player.setAttribute('value', 'player');

        let target = makeDiv(null, 'builder-menu-button builder-target');
        target.setAttribute('value', 'target');

        let enemies = makeDiv(null, 'builder-menu-button builder-enemies');
        enemies.setAttribute('value', 'enemies');

        let helpers = makeDiv(null, 'builder-menu-button builder-helpers');
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

        let snake = makeDiv(null, 'builder-menu-button builder-snake active');
        snake.setAttribute('value', 'snake');

        let snakeimage = document.createElement('img');
        snakeimage.src = eimages.snake;
        snake.append(snakeimage);

        let eagle = makeDiv(null, 'builder-menu-button builder-eagle');
        eagle.setAttribute('value', 'eagle');

        let eagleimage = document.createElement('img');
        eagleimage.src = eimages.eagle;
        eagle.append(eagleimage);

        let hunter = makeDiv(null, 'builder-menu-button builder-hunter');
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
        this.listener = (e) => {
            if (this.mode !== undefined) {
                let t = e.lngLat.toArray();
                // PLAYER
                if (this.mode === 'player') {
                    if (this.player !== undefined) {
                        let tmp = this.player;
                        tmp.despawn(() => { tmp.destroy(); })
                    }
                    let player = new Rabbit({
                        layer: this.rabbitsLayer,
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
                        layer: this.rabbitsLayer,
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
                            layer: this.enemiesLayer,
                            coordinates: t
                        });
                        hunter.spawn();
                        hunter.revealArea();
                        this.enemies.push(hunter);
                    } else if (this.modeEnemies === 'eagle') {
                        let eagle = new Eagle({
                            layer: this.enemiesLayer,
                            coordinates: t
                        });
                        eagle.spawn();
                        eagle.revealArea();
                        this.enemies.push(eagle);
                    } else if (this.modeEnemies === 'snake') {
                        let snake = new Snake({
                            layer: this.enemiesLayer,
                            coordinates: t
                        });
                        snake.spawn();
                        snake.revealArea();
                        this.enemies.push(snake);
                    }
                }
                // HELPERS
                else if (this.mode === 'helpers') {
                    let helper = new Helper({
                        layer: this.helpersLayer,
                        coordinates: t
                    });
                    helper.reveal();
                    helper.spawn();
                    this.helpers.push(helper);
                }
            }
        }
        this.basemap.addListener('click', this.listener);
    }
}

export default Builder;