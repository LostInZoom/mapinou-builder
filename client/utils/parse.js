import { makeDiv } from "./dom.js"

/**
 * Retrieve the CSS color variables.
 * @param  {String} themes The themes to retrieve the colors from.
 * @return {Object}        Css colors.
 */
function getColorsByClassNames(...className) {
    let colors = {};
    for (let i = 0; i < className.length; i++) {
        let c = className[i];
        let div = makeDiv(null, c);
        document.body.append(div);
        let style = window.getComputedStyle(div);
        colors[c] = style.backgroundColor
        div.remove();
    }
    return colors;
}

export { getColorsByClassNames }