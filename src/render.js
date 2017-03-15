'use strict';

const util = require('./util.js');

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
  // TODO: Handle synthetic Symbol.for('Restricted function property')

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
      return obj.toLocaleString();
    case 'boolean':
    case 'function':
    case 'symbol':
      return String(obj);
    case 'object':
      if (null === obj) {
        return 'null';
      } else if (obj instanceof Date) {
        return obj.toLocaleString();
      } else {
        throw new TypeError('Can’t format objects');
      }
  }
}

function isCallable(obj) {
  return 'function' === typeof obj;
}

/**
 * 
 * 
 * @param {boolean} test         - whether to return `success` or `failure`
 * @param {any|function} success - if `test` evaluates to `true` (or truth-y)
 *                                 return the value, or if `success` is a function call that 
 *                                 function and return its value
 * @param {any|function} failure - if `test` evaluates to `false` (or false-y) 
 *                                 return the value, or if `success` is a function call that 
 *                                 function and return its value
 * @returns {any}
 */
function iif(test, success, failure) {
  if (test) {
    return isCallable(success) ? success() : success;
  } else {
    return isCallable(failure) ? failure() : failure;
  }
}

/**
 * Like `iif`, but falls back to an empty `string`
 * 
 * @param {boolean} test 
 * @param {any|function} success 
 * @returns {any|string}
 * @see iif
 */
function iis(test, success) {
  return iif(test, success, '');
}

function renderProperty(prop) {
  const classNames = [
    iis(prop.isEnumerable, 'is-enumerable'),
    iis(prop.overrideOf, 'is-override'),
    iis(prop.isOverridden, 'is-overridden'),
  ];
  return `
<div class="property typeof-${prop.instanceOf} ${classNames.join(' ')}">
  <span class="name">${prop.name}</span> 
  ${iis(prop.from, `<span class="from">from ${prop.from}</span>`)}
  ${iis(prop.overrideOf, `<span class="override-of">overrides ${prop.overrideOf}</span> `)}
  <span class="instance-of">${prop.instanceOf}</span> 
  <span class="value">${iif(
    util.isPrimitiveOrNull(prop.value),
    prop.value,
    () => renderObject(prop.value, true)
  )}</span>
</div>`;
}

function renderIteratorValues(obj, i) {
  return `<div class="iterator-value">
  Value: ${i}  <span class="instance-of">${obj.instanceOf}</span> 
  <span class="value">${iif(util.isPrimitiveOrNull(obj), obj, renderObject(obj, true))}</span>
  
</div>`;
}
function renderObject(obj, hideType) {
  return `<div class="object">
  ${iis(!hideType, `<div class="instance-of">${obj.instanceOf}</div>`)}
  <span class="value">${iis(obj.value, obj.value)}</span>
  ${iis(obj.iterableValues, () =>
      `<div class="iterable-values">${obj.iterableValues
        .map(renderIteratorValues)
        .join('\n')}</div>`)}
  <div class="properties">${obj.properties.map(renderProperty).join('\n')}</div>
</div>`;
}

function renderHTML(obj) {
  return `
<html>
  <head>
    <link type="text/css" rel="stylesheet" href="object-describe.css" />
    <script type="text/javascript" src="ui.js">//</script>
  </head>
  <body>
    <div>${renderObject(obj)}</div>
  </body>
</html>`;
}

/**
 * 
 * 
 * @param {object} signature - an object with `name` (`string`) and `parameters` (`string[]`) properties
 * @returns {string}
 * @see parseFunctionSignature
 */
function serializeFunctionSignature(signature) {
  return `function ${signature.name} (${signature.parameters.join[', ']})`;
}

module.exports.renderHTML = renderHTML;
module.exports.serializePrimitive = serializePrimitive;
