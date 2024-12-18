import { ajaxGet } from './ajax.js';

/**
 * Create a div with custom properties. Append the div to the parent if provided.
 * @param  {String} id         ID of the element.
 * @param  {String} c          Class of the element.
 * @param  {String} html       Content of the element.
 * @param  {DOMElement} parent Parent element to append the div to.
 * @return {DOMElement}        Created element.
 */
function makeDiv(id=null, c=null, html=null, parent=null) {
    let div = document.createElement('div');
    if (id !== null) { div.setAttribute('id', id); }
    if (c !== null) { div.setAttribute('class', c); }
    if (html !== null) { div.innerHTML = html; }
    if (parent !== null) { parent.appendChild(div); }
    return div;
}

/**
 * Adds an svg as the inner HTML of the target div.
 * @param  {DOMElement} target Target to place the svg.
 * @param  {String}            SVG file url.
 */
function addSVG(target, url) {
    ajaxGet(url, (svg) => { target.innerHTML = svg; });
}

/**
 * Retrieve the SCSS color variables.
 * @param  {String} themes The themes to retrieve the colors from.
 * @return {Object}        Css colors.
 */
function getCSSColors(...themes) {
    let colors = {};
    for (let i = 0; i < themes.length; i++) {
        let theme = themes[i];
        let colorDiv = makeDiv(theme + '-theme', null, 'css-theme');
        document.body.append(colorDiv);
        let bodyBeforeContent = window.getComputedStyle(colorDiv, ':before').content || '';
        colors[themes[i]] = JSON.parse(JSON.parse(bodyBeforeContent.replace(/,\}/, '}')));
        colorDiv.remove();
    }
    return colors;
}

/**
 * Remove element from the DOM.
 * @param {DOMElement} args The DOM Elements to remove.
 */
function remove(...args) {
    for (let i = 0; i < args.length; i++) {
        args[i].remove();
    }
}

/**
 * Remove all elements inside the DOM element.
 * @param {DOMElement} element The DOM Elements to clear.
 */
function clearElement(element) {
    for (let i = 0; i < element.children.length; i++) {
        element.childNodes[i].remove();
    }
}

export { clearElement, makeDiv, addSVG, getCSSColors, remove }