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
  /*
{
  "is": "Object",
  "properties": [
    {
      "name": "str",
      "enumerable": true,
      "configurable": true,
      "from": "Object",
      "value": "\"string\"",
      "is": "string"
    },
    {
      "name": "obj",
      "enumerable": true,
      "configurable": true,
      "from": "Object",
      "value": {
        "is": "Object",
        "properties": [
          {
            "name": "b",
            "enumerable": true,
            "configurable": true,
            "from": "Object",
            "value": "\"B\"",
            "is": "string"
          }
        ],
        "prototype": {…}
      }
    },
    {
      "name": "fct",
      "enumerable": true,
      "configurable": true,
      "from": "Object",
      "value": {
        "name": "",
        "parameters": [
          "param=def"
        ],
        "body": "    const x = 'X';\n    return x;",
        "isNative": false,
        "isGenerator": false
      },
      "is": "Function"
    },
    {
      "name": "lambda",
      "enumerable": true,
      "configurable": true,
      "from": "Object",
      "value": {
        "parameters": [
          "p"
        ],
        "body": "void 0",
        "isLambda": true
      },
      "is": "Function"
    },
    {
      "name": "gettersetter",
      "enumerable": true,
      "configurable": true,
      "getter": {
        "name": "get gettersetter",
        "parameters": [],
        "body": "    return this._id;",
        "isNative": false,
        "isGenerator": false
      },
      "setter": {
        "name": "set gettersetter",
        "parameters": [
          "value"
        ],
        "body": "    this._it = value;",
        "isNative": false,
        "isGenerator": false
      },
      "from": "Object",
      "value": "undefined",
      "is": "undefined"
    },
    {
      "name": "Symbol(Symbol.iterator)",
      "enumerable": true,
      "configurable": true,
      "from": "Object",
      "value": {
        "name": "",
        "parameters": [],
        "body": "    yield 1;",
        "isNative": false,
        "isGenerator": true
      },
      "is": "GeneratorFunction"
    }
  ],
  "prototype": {…}
}
  */
  const classNames = [
    'property',
    iis(!hasAccessor(prop), `is-${prop.is}`),
    iis(prop.enumerable, 'enumerable'),
    iis(prop.configurable, 'configurable'),
    iis(hasAccessor(prop), 'toggleable toggle-none'),
  ];
  const title = `${objInstance}#${prop.name}`;
  const value = `${renderValue(prop.value, prop.is, prop.name)}`;
  return `
<div class="${classNames.join(' ')}">
  ${iis(!(prop.value && prop.value.properties), `
      <span class="name" title="${title}">${prop.name}</span> 
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
  return `<span class="value">${fct}</span>`;
}

function renderObject(obj, name) {
  if (undefined === obj) return '';
  // TODO: Implement primitives
  const classNames = [
    'object',
    'toggleable',
    iis(PROTOTYPE === name, 'prototype toggle-none'),
    iis(obj.isIterable, 'iterable'),
  ];
  return `
  <div class="${classNames.join(' ')}">
    ${iif('string' === typeof name, () => `<span class="name">${name}</span>`, () => iis(PROTOTYPE === name, 'Prototype'))}
    <span class="is is-${obj.is}">${obj.is}</span><!-- iterable--><span></span>
    <div class="toggle-group">
      ${iis(obj.properties, () => `
        <div class="properties">
          ${obj.properties.map(prop => renderProperty(prop, obj.is)).join('')}
        </div>`)}
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
  </head>
  <body>
    <div id="describe-object">${renderObject(obj)}</div>
    <script type="text/javascript" src="ui.js">//</script>
    <h2>Raw Report</h2>
    <pre style="width: 100%; font-family: 'SF Mono', Consolas, monospace; color: #333; line-height: 1.45;font-size: 85%;">${JSON.stringify(obj, null, 2)}</pre>
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
