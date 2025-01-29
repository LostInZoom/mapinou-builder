import { Application } from "./interface/application.js";
import { ajaxGet } from "./utils/ajax.js";

window.addEventListener("DOMContentLoaded", () => {
    ajaxGet('configuration/', (params) => {
        new Application(params);
    });
})