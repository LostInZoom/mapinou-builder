import Application from "./game/application.js";
import { ajaxGet } from "./utils/ajax.js";
import { wait } from "./utils/dom.js";

async function register(callback) {
    callback = callback || function() {};
    let sessionId = localStorage.getItem('session');
    if (sessionId) {
        callback();
    } else {
        ajaxGet('registration/', (data) => {
            localStorage.setItem('session', data.sessionId);
            callback();
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

    register(() => {
        ajaxGet('configuration/', (params) => {
            new Application(params);
        });
    });
});