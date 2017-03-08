'use strict';

// FIXME: NO! NO! NO! Library modules *must* support relative imports using `./`
const util = require('src/util.js');

/**
 * Serializes a primitive value as a string. This is optimized for human
 * consumption, not machine interoperability. Thus, it uses `.toLocaleString()`
 * for `number` and `date` instances.
 * 
 * @param {any} obj 
 * @param {number} trunc - maximum length of `string` serialization 
 * @returns {string}
 * @throws {TypeError} - non-primitive
 */
function serializePrimitive(obj, trunc) {
  trunc = trunc || 50;
  function truncate(str) {
    let suffix = '';
    if (str.length > trunc) suffix = '…';
    return str.substring(0, trunc) + suffix;
  }
  if (null === obj) return 'null';
  switch (typeof obj) {
    case 'undefined':
      return 'undefined';
    case 'string':
      return `"${truncate(obj)}"`;
    case 'number':
      if (Number.isNaN(obj)) return 'NaN';
      return String(obj); // obj.toLocaleString();
    case 'boolean':
    case 'function':
    case 'symbol':
      return String(boolean);
    case 'object':
      if (obj instanceof Date) {
        return String(obj); // obj.toLocaleString();
      } else {
        throw new TypeError('Can’t format objects');
      }
  }
}

function renderProperty(prop) {
  return `<div class="property ${prop.isEnumerable
    ? 'is-enumerable'
    : ''} ${prop.overrideOf ? 'is-override' : ''} ${prop.isOverridden
    ? 'is-overridden'
    : ''} typeof-${prop.instanceOf}">
  <span class="name">${prop.name}</span> 
  ${prop.from ? `<span class="from">from ${prop.from}</span> ` : ''}
  ${prop.overrideOf
    ? `<span class="override-of">overrides ${prop.overrideOf}</span> `
    : ''}
  <span class="instance-of">${prop.instanceOf}</span> 
  <span class="value">${util.isPrimitiveOrNull(prop.value)
    ? prop.value
    : renderObject(prop.value, true)}</span>
</div>`;
}

function renderIteratorValues(obj, i) {
  return `<div class="iterator-value">
  Value: ${i}  <span class="instance-of">${obj.instanceOf}</span> 
  <span class="value">${util.isPrimitiveOrNull(obj)
    ? obj
    : renderObject(obj, true)}</span>
  
</div>`;
}
function renderObject(obj, hideType) {
  return `<div class="object">
  ${!hideType ? `<div class="instance-of">${obj.instanceOf}</div>` : ''}
  ${obj.iterableValues
    ? `<div class="iterable-values">${obj.iterableValues
        .map(renderIteratorValues)
        .join('')}</div>`
    : ''}
  <div class="properties">${obj.properties.map(renderProperty).join('')}</div>
</div>`;
}

function renderHTML(obj) {
  return `
<html>
  <head>
    <link type="text/css" rel="stylesheet" href="object-describe.css"/>
  </head>
  <body>
    <div>${renderObject(obj)}</div>
  </body>
</html>`;
}

module.exports.renderHTML = renderHTML;
