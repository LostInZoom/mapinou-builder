import Basemap from './map.js';
import Router from './routing.js';
import { makeDiv, addSVG } from './utils/dom.js';

import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom.js';
import {
    Circle as CircleStyle,
    Fill,
    Stroke,
    Style,
} from 'ol/style.js';
import {getVectorContext} from 'ol/render.js';

import { ajaxGet } from './utils/ajax.js';
import { project } from './map.js';

function initialize() {
    let target = makeDiv('application');
    document.body.append(target);

    let position = [ 406214.54,5784408.44 ]
    let zoom = 16

    let application = new Application(target);
    application.basemap.setCenter(position)
    application.basemap.setZoom(zoom);

    let router = new Router(application.basemap);

    const player = new Feature({
        type: 'player',
        geometry: new Point(position),
    });

    const styles = {
        'route': new Style({
                stroke: new Stroke({
                width: 6,
                color: [100, 100, 100, 0.5],
            }),
        }),
        'player': new Style({
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({color: 'black'}),
                stroke: new Stroke({
                    color: 'white',
                    width: 2,
                }),
            }),
        }),
    };

    const vectorLayer = new VectorLayer({
        source: new VectorSource({
            features: [ player ],
        }),
        style: function (feature) {
            return styles[feature.get('type')];
        },
    });

    console.log(application.basemap);
    application.basemap.map.addLayer(vectorLayer);

    application.basemap.map.on('click', (e) => {
        const target = application.basemap.map.getEventCoordinate(event)
        const origin = project('3857', '4326', position);
        const destination = project('3857', '4326', target);
        let url = 'https://data.geopf.fr/navigation/itineraire?'
            + 'resource=bdtopo-osrm'
            + '&profile=pedestrian'
            + '&optimization=shortest'
            + '&start='+origin[0]+','+origin[1]
            + '&end='+destination[0]+','+destination[1]
            + '&geometryFormat=geojson'
        
        ajaxGet(url, (result) => {
            const vertexes = []
            for (let i = 0; i < result.geometry.coordinates.length; i++) {
                vertexes.push(project('4326', '3857', result.geometry.coordinates[i]));
            }

            const route = new LineString(vertexes);

            const routeFeature = new Feature({
                type: 'route',
                geometry: route,
            });

            const routeLayer = new VectorLayer({
                source: new VectorSource({
                    features: [ routeFeature ],
                }),
                style: function (feature) {
                    return styles[feature.get('type')];
                },
            });

            application.basemap.map.addLayer(routeLayer);
            player.setGeometry(null);
        })
    });


}

class Application {
    constructor(parent) {
        this.parent = parent;
        this.container = makeDiv('container');
        this.homenode = makeDiv('home', 'menu-container');
        this.gamenode = makeDiv('game', 'menu-container');
        this.buttons = [];

        this.homebutton = makeDiv('button-home', 'button-game button');
        addSVG(this.homebutton, './src/img/home.svg');
        this.homebutton.addEventListener('click', this.menu);

        this.gamenode.append(this.homebutton);

        this.#addButton('Start', this.homenode, this.play);
        this.#addButton('Tutorial', this.homenode);
        this.#addButton('Options', this.homenode);

        this.container.append(this.homenode, this.gamenode);
        this.parent.append(this.container);

        this.basemap = this.#addMap(this.gamenode);
    }

    play(e) {
        e.target.parentNode.parentNode.style.transform = 'translateX(-100%)'
    }

    menu(e) {
        e.target.parentNode.parentNode.style.transform = 'translateX(0%)'
    }

    #addButton(content, parent, listener) {
        let b = makeDiv('', 'button-menu button', content);
        
        if (typeof listener !== 'undefined') {
            b.addEventListener('click', listener);
        }
        
        parent.append(b);
        this.buttons.push(b);
    }

    #addMap(parent) {
        let map = new Basemap(parent);
        return map;
    }
}

export default initialize