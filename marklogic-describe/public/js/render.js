var render = (function (exports) {
  'use strict';

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

  const PROTOTYPE = Symbol('PROTOTYPE');

  /**
   *
   *
   * @param {any} obj
   * @returns {boolean} - whether the object is callable as a function
   *
   * @private
   */
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
   *
   * @private
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
   *
   * @private
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
   *
   * @private
   */
  function renderProperty(prop, objInstance) {
    const isOverridden = prop.overriddenBy && prop.overriddenBy.length > 0;
    const classNames = [
      'property',
      iis(!hasAccessor(prop), `is-${prop.is}`),
      iis(prop.enumerable, 'enumerable'),
      iis(prop.configurable, 'configurable'),
      iis(isOverridden, 'overridden'),
      iis(hasAccessor(prop), 'toggleable toggle-none')
    ];
    const title = iif(
      prop.name,
      `${objInstance}#${prop.name}${iis(
      isOverridden,
      () => ` overridden by ${prop.overriddenBy[0]}`
    )}`,
      objInstance
    );
    const value = `${renderValue(prop.value, prop.is, prop.name)}`;
    return `
<div class="${classNames.join(' ')}">
  ${iis(
    !(prop.value && prop.value.properties),
    `
      ${iis(
        prop.name,
        () =>
          `<span class="name" title="${escapeHTML(title)}">${escapeHTML(
            prop.name
          )}</span>`
      )}
      ${iis(!hasAccessor(prop), `<span class="is">${prop.is}</span>`)}
    `
  )}
  ${iis(!hasAccessor(prop), value)}
  ${renderAccessors(prop)}
</div>`;
  }

  /**
   *
   *
   * @param {any} prop
   * @returns
   *
   * @private
   */
  function renderAccessors(prop) {
    if (!hasAccessor(prop)) return '';
    return `
    <div class="accessors toggle-group">
      ${iis(
        prop.getter,
        `<div class="getter is-function"> get <span class="value">${
          prop.getter
        }</span></div>`
      )}
      ${iis(
        prop.setter,
        `<div class="setter is-function"> set <span class="value">${
          prop.setter
        }</span></div>`
      )}
    </div>`;
  }

  /**
   *
   *
   * @param {any} iterables
   * @returns {string}
   *
   * @private
   */
  function renderIterables(iterables) {
    if (undefined === iterables) return '';
    return `
    <div class="iterables toggleable">
      <span class="name">Iterables</span>
      <div class="buckets toggle-group">
        ${iterables.map(renderBucket).join('')}
        <div class="truncated" title="Values truncated for display">${iis(
          iterables.truncated,
          '<div class="truncated">…</div>'
        )}</div>
      </div>
    </div>
  `;
  }

  /**
   *
   *
   * @param {any} bucket
   * @returns
   *
   * @private
   */
  function renderBucket(bucket) {
    const lower = bucket.bounds[0];
    const upper = bucket.bounds[1];
    return `
    <div class="bucket toggleable toggle-none">
      <span class="name">${lower}–${Math.min(
    upper,
    lower + bucket.items.length - 1
  )}</span>
      <div class="toggle-group">
        ${bucket.items
          .map(
            (item, index) =>
              `<div class="item">${renderObject(item, String(lower + index), {
                toggle: 'none'
              })}</div>`
          )
          .join('')}
      </div>
    </div>
  `;
  }

  /**
   * @param {Object} prop
   * @returns {boolean}
   *
   * @private
   */
  function hasAccessor(prop) {
    return Boolean(prop.getter || prop.setter);
  }

  /**
   * @param {any} value
   * @param {string} [type='Object']
   * @param {any} name
   * @returns
   *
   * @private
   */
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

  /**
   * @param {any} fct
   * @returns {string}
   *
   * @private
   */
  function renderFunction(fct) {
    return `<span class="value">${escapeHTML(String(fct))}</span>`;
  }

  /**
   * @param {any} obj
   * @param {string} name
   * @param {Object[]} [state={}]
   * @returns {string}
   *
   * @private
   */
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
      iis(obj.isIterable, 'iterable')
    ];
    return `
  <div class="${classNames.join(' ')}">
    ${iif(
      'string' === typeof name,
      () => `<span class="name">${name}</span>`,
      () =>
        iis(
          PROTOTYPE === name,
          '<span class="name" title="Prototype">Proto</span>'
        )
    )}
    <span class="is is-${obj.is}">${obj.is}</span>
    <span class="summary">${escapeHTML(obj.summary)}</span>
    <div class="${iis(obj.properties, 'toggle-group')}">
      ${iis(
        obj.properties,
        () => `
        <div class="properties">
          ${obj.properties.map(prop => renderProperty(prop, obj.is)).join('')}
        </div>`
      )}
      ${renderIterables(obj.iterables)}
      ${iis(obj.prototype, () => `${renderObject(obj.prototype, PROTOTYPE)}`)}
    </div>
  </div>`;
  }
  /**
   *
   *
   * @param {describe:Description} obj
   * @returns {string}
   *
   * @since 0.1.0
   */
  function renderHTML(obj) {
    return renderObject(obj);
  }

  /**
   * Escpaes strings for HTML. Make sure not to escape HTML
   * strings twice.
   *
   * @param {string} str - raw string (not HTML)
   * @returns {string} - escaped string
   * @throws {TypeError} - non-string input
   *
   * @private
   */
  function escapeHTML(str) {
    if ('string' !== typeof str) {
      throw new TypeError(`${typeof str} is not a string`);
    }
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  exports.escapeHTML = escapeHTML;
  exports.renderHTML = renderHTML;

  return exports;

}({}));
