import device from "current-device";

import Application from "./game/application.js";
import { ajaxGet, ajaxPost } from "./utils/ajax.js";

async function register(callback) {
    callback = callback || function() {};

    function getInformation() {
        return {
            userAgent: navigator.userAgent,
            device: device.type,
            orientation: device.orientation,
            os: device.os,
            width: window.innerWidth,
            height: window.innerHeight,
        }
    }

    let sessionId = localStorage.getItem('session');
    let results = { consent: false, form: false };

    if (sessionId) {
        ajaxPost('verification/', { sessionId: sessionId }, (data) => {
            if (data.isPresent) {
                results.index = parseInt(sessionId);
                results.consent = data.consent;
                results.form = data.form;
                callback(results);
            } else {
                ajaxPost('registration/', getInformation(), (data) => {
                    localStorage.setItem('session', data.sessionId);
                    results.index = parseInt(data.sessionId);
                    callback(results);
                });
            }
        });
    } else {
        ajaxPost('registration/', getInformation(), (data) => {
            localStorage.setItem('session', data.sessionId);
            results.index = parseInt(data.sessionId);
            callback(results);
        });
    }
}

window.addEventListener("DOMContentLoaded", () => {
    async function activatePersistence() {
        if (navigator.storage && navigator.storage.persist) {
            await navigator.storage.persist();
        }
    }
    activatePersistence();

    register((sessionId) => {
        ajaxGet('configuration/', (params) => {
            // Retrieve the current session progression
            let progression = localStorage.getItem('progression');
            if (!progression) {
                progression = { tier: 0, level: 0 };
                localStorage.setItem('progression', progression);
            }

            params.session = sessionId;
            params.progression = progression;

            new Application(params);
        });
    });
});