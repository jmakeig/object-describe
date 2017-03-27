'use strict';

const { isPrimitiveOrNull } = require('./util.js');

function isCallable(obj) {
  return 'function' === typeof obj;
}

/**
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
  }
  return isCallable(failure) ? failure() : failure;
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
  return iif(test, undefined === success ? test : success, '');
}

function renderProperty(prop, objInstance) {
  /*
    name         string
    value        string
    instanceOf   string
    from         string[]
    enumerable   boolean
    configurable boolean
    getter
      name       string
      params     string[]
    setter
      name       string
      params     string[]
  */

  // If current instance exists in the hierarchy, get the next one,
  // i.e. the type that it overrides
  const current = prop.from.indexOf(objInstance);
  const next = current > -1 && current < prop.from.length
    ? prop.from[current + 1]
    : undefined;
  const overriddenBy = current > 0 ? prop.from[current - 1] : undefined;
  const classNames = [
    'property',
    `typeof-${prop.is}`,
    iis(prop.enumerable, 'is-enumerable'),
    iis(prop.configurable, 'is-configurable'),
    iis(overriddenBy, 'is-overridden'),
  ];
  const title = `${objInstance}#${prop.name}${iis(overriddenBy, `, overridden by ${overriddenBy}`)}`;
  return `
<div class="${classNames.join(' ')}">
  <span class="name" title="${title}">${prop.name}</span> 
  ${iis(next, `<span class="override-of">overrides ${next}</span> `)}
  <span class="instance-of">${prop.is}</span> 
  <span class="value">
    ${iif(isPrimitiveOrNull(prop.value), prop.value, () =>
    renderObject(prop.value, true))}</span>
</div>`;
}

// function renderIteratorValues(obj, i) {
//   return `<div class="iterator-value">
//   Value: ${i}  <span class="instance-of">${obj.is}</span>
//   <span class="value">${iif(isPrimitiveOrNull(obj), obj, renderObject(obj, true))}</span>

// </div>`;
// }

function renderObject(obj, hideType) {
  if (undefined === obj) return '';
  return `<div class="object">
  <div class="properties">
    ${obj.properties.map(prop => renderProperty(prop, obj.is)).join('')}
  </div>
  ${obj.prototype ? `<div class="prototype">
    Prototype: ${obj.prototype.is} 
    ${renderObject(obj.prototype)}
  </div>` : ''}
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
// eslint-disable-next-line no-unused-vars
function serializeFunctionSignature(signature) {
  return `function ${signature.name} (${signature.parameters.join[', ']})`;
}

module.exports.renderHTML = renderHTML;
