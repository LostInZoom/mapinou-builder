import Application from "./game/application.js";
import { ajaxGet } from "./utils/ajax.js";

window.addEventListener("DOMContentLoaded", () => {
    async function activatePersistence() {
        if (navigator.storage && navigator.storage.persist) {
            await navigator.storage.persist();
        }
    }
    activatePersistence();

    ajaxGet('configuration/', (params) => {
        new Application(params);
    });
});