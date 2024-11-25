//Create a div with specified attributes
function makeElement(className, content, id) {
    let e = document.createElement('div');
    if (id) { e.setAttribute('id', id) }
    if (className) { e.setAttribute('class', className) }
    if (content) { e.innerHTML = content; }
    return e;
}

export { makeElement }