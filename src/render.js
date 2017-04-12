/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 
 * Copyright 2017 MarkLogic Corp.                                             *
 *                                                                            *
 * Licensed under the Apache License, Version 2.0 (the "License");            *
 * you may not use this file except in compliance with the License.           *
 * You may obtain a copy of the License at                                    *
 *                                                                            *
 *     http://www.apache.org/licenses/LICENSE-2.0                             *
 *                                                                            *
 * Unless required by applicable law or agreed to in writing, software        *
 * distributed under the License is distributed on an "AS IS" BASIS,          *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   *
 * See the License for the specific language governing permissions and        *
 * limitations under the License.                                             *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */
'use strict';

const PROTOTYPE = Symbol('PROTOTYPE');

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

/**
 * 
 * 
 * @param {any} prop 
 * @param {string} objInstance 
 * @returns 
 */
function renderProperty(prop, objInstance) {
  const classNames = [
    'property',
    iis(!hasAccessor(prop), `is-${prop.is}`),
    iis(prop.enumerable, 'enumerable'),
    iis(prop.configurable, 'configurable'),
    iis(hasAccessor(prop), 'toggleable toggle-none'),
  ];
  const title = iif(prop.name, `${objInstance}#${prop.name}`, objInstance);
  const value = `${renderValue(prop.value, prop.is, prop.name)}`;
  return `
<div class="${classNames.join(' ')}">
  ${iis(!(prop.value && prop.value.properties), `
      ${iis(prop.name, () => `<span class="name" title="${escapeHTML(title)}">${escapeHTML(prop.name)}</span>`)}
      ${iis(!hasAccessor(prop), `<span class="is">${prop.is}</span>`)}
    `)}
  ${iis(!hasAccessor(prop), value)}
  ${renderAccessors(prop)}
</div>`;
}

function renderAccessors(prop) {
  if (!hasAccessor(prop)) return '';
  return `
    <div class="accessors toggle-group">
      ${iis(prop.getter, `<div class="getter is-function"> get <span class="value">${prop.getter}</span></div>`)}
      ${iis(prop.setter, `<div class="setter is-function"> set <span class="value">${prop.setter}</span></div>`)}
    </div>`;
}

/**
 * 
 * 
 * @param {any} iterables 
 * @returns {string}
 */
function renderIterables(iterables) {
  if (undefined === iterables) return '';
  return `
    <div class="iterables toggleable">
      <span class="name">Iterables</span>
      <div class="buckets toggle-group">
        ${iterables.map(renderBucket).join('')}
        <div class="truncated" title="Values truncated for display">${iis(iterables.truncated, '<div class="truncated">…</div>')}</div>
      </div>
    </div>
  `;
}

function renderBucket(bucket) {
  const lower = bucket.bounds[0];
  const upper = bucket.bounds[1];
  return `
    <div class="bucket toggleable toggle-none">
      <span class="name">${lower}–${Math.min(upper, lower + bucket.items.length - 1)}</span>
      <div class="toggle-group">
        ${bucket.items
    .map((item, index) => `<div class="item">${renderObject(
          item,
          String(lower + index),
          {
            toggle: 'none',
          }
        )}</div>`)
    .join('')}
      </div>
    </div>
  `;
}

/**
 * @param {Object} prop 
 * @returns {boolean}
 */
function hasAccessor(prop) {
  return Boolean(prop.getter || prop.setter);
}

function renderValue(value, type = 'Object', name) {
  switch (type) {
    // Would this be better handled by a custom class
    case 'Function':
    case 'GeneratorFunction':
      return renderFunction(value);
    default:
      if ('string' === typeof value) {
        return `<span class="value">${value}</span>`;
      }
      return `${renderObject(value, name)}`;
  }
}

function renderFunction(fct) {
  return `<span class="value">${escapeHTML(String(fct))}</span>`;
}

function renderObject(obj, name, state = {}) {
  if (undefined === obj) return '';
  if (obj.isPrimitive) {
    // For primitives, the name is only relevant as part of an iterable
    const named = Object.assign(obj, { name: name });
    return renderProperty(named, obj.is);
  }
  // TODO: Implement primitives
  const classNames = [
    'object',
    iis(obj.properties, 'toggleable'),
    iis('none' === state.toggle, 'toggle-none'),
    iis(PROTOTYPE === name, 'prototype toggle-none'),
    iis(obj.isIterable, 'iterable'),
  ];
  return `
  <div class="${classNames.join(' ')}">
    ${iif('string' === typeof name, () => `<span class="name">${name}</span>`, () => iis(PROTOTYPE === name, '<span class="name" title="Prototype">Proto</span>'))}
    <span class="is is-${obj.is}">${obj.is}</span>
    <div class="${iis(obj.properties, 'toggle-group')}">
      ${iis(obj.properties, () => `
        <div class="properties">
          ${obj.properties.map(prop => renderProperty(prop, obj.is)).join('')}
        </div>`)}
      ${renderIterables(obj.iterables)}
      ${iis(obj.prototype, () => `${renderObject(obj.prototype, PROTOTYPE)}`)}
    </div>
  </div>`;
}

function renderHTML(obj) {
  return `
<!DOCTYPE html>
<html>
  <head>
    <title>Object Properties and Prototypes—HTML</title>
    <link type="text/css" rel="stylesheet" href="object-describe.css" />
    <style type="text/css">
      body {
        padding: 1em;
        font-family: Helvetica;
        color: #333;
        font-size: 12pt;
      }
      h2 { margin: 0.5em 0; }
    </style>
  </head>
  <body>
    <div class="toggleable">
      <h2 style="display: inline;">Describe</h2>
      <div class="toggle-group" style="border: none;">
        <div id="describe-object">${renderObject(obj)}</div>
      </div>
    </div>
    <script type="text/javascript" src="ui.js">//</script>
    <div class="toggleable toggle-none">
      <h2 style="display: inline;">Raw Report</h2>
      <div class="toggle-group">
        <pre style="width: 100%; font-family: 'SF Mono', Consolas, monospace; color: #333; line-height: 1.45;font-size: 85%;">${escapeHTML(JSON.stringify(obj, null, 2))}</pre>
      </div>
    </div>
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
  return escapeHTML(
    `function ${signature.name} (${signature.parameters.join[', ']})`
  );
}

/**
 * Escpaes strings for HTML. Make sure not to escape HTML
 * strings twice.
 * 
 * @param {string} str - raw string (not HTML)
 * @returns {string} - escaped string
 * @throws {TypeError} - non-string input
 */
function escapeHTML(str) {
  if ('string' !== typeof str) {
    throw new TypeError(`${typeof str} is not a string`);
  }
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports.renderHTML = renderHTML;
