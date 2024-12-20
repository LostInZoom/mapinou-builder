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
 * Check if the given element has the class.
 * @param  {DOMElement} e Element to check.
 * @param  {String} c     Class to check.
 */
function hasClass(e, c) {
    if (e.classList)
        return e.classList.contains(c)
    else
        return !!e.c.match(new RegExp('(\\s|^)' + c + '(\\s|$)'))
};

/**
 * Remove the given class from a given element.
 * @param  {DOMElement} e Element to remove the class from.
 * @param  {String} c     Class to remove.
 */
function removeClass(e, c) {
    if (e.classList)
        e.classList.remove(c)
    else if (hasClass(e, c)) {
        var reg = new RegExp('(\\s|^)' + c + '(\\s|$)')
        e.c = el.c.replace(reg, ' ')
    }
};

/**
 * Remove the given class from a list of given elements.
 * @param  {Array} e   Elements to remove the class from.
 * @param  {String} c  Class to remove.
 */
function removeClassList(e, c) {
    for (let i = 0; i < e.length; ++i) { removeClass(e[i], c) }
};

/**
 * Add the given class to a given element.
 * @param  {DOMElement} e Element to add the class to.
 * @param  {String} c     Class to add.
 */
function addClass(e, c) {
    if (e.classList)
        e.classList.add(c)
    else if (!hasClass(e, c)) e.c += " " + c
};

/**
 * Add the given class to a list of given elements.
 * @param  {Array} e   Elements to add the class to.
 * @param  {String} c  Class to add.
 */
function addClassList(e, c) {
    for (let i = 0; i < e.length; ++i) { addClass(e[i], c) }
};

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

export {
    makeDiv, hasClass, addClass, removeClass, addClassList, removeClassList,
    clearElement, addSVG, getCSSColors, remove
}