import device from "current-device";

import Application from "./game/application.js";
import { ajaxGet, ajaxPost } from "./utils/ajax.js";

window.addEventListener("DOMContentLoaded", function () {
    function register(callback) {
        callback = callback || function () { };

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

    async function activatePersistence() {
        if (navigator.storage && navigator.storage.persist) {
            await navigator.storage.persist();
        }
    }

    activatePersistence();
    register((sessionId) => {
        ajaxGet('configuration/', (params) => {
            // Retrieve the current session progression
            let tier = localStorage.getItem('tier');
            let level = localStorage.getItem('level');
            if (!tier) {
                localStorage.setItem('tier', 0);
                localStorage.setItem('level', 0);
            }

            params.session = sessionId;
            params.progression = {
                tier: parseInt(tier),
                level: parseInt(level)
            };

            new Application(params);
        });
    });
});