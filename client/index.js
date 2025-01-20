import { Application } from "./interface/menu.js";
import { makeDiv } from "./utils/dom.js";

window.addEventListener("DOMContentLoaded", function() {
    let target = makeDiv('application');
    document.body.append(target);
    new Application(target);
    return target;
});