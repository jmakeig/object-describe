var describe = (function () {
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

  /**
   * @constant
   * @private
   */
  const RESTRICTED_FUNCTION_PROPERTY = Symbol(
    'RESTRICTED_FUNCTION_PROPERTY'
  );

  /**
   * Get the type of any object. Primitives return primitive name.
   * Objects use `constructor.name` or fallback to `Object.prototype.toString()`.
   *
   * @param {any} obj  - any object or primitive, including `null` and `undefined`
   * @returns {string} - the type of the objet
   *
   * @private
   */
  function instanceType(obj) {
    const typeOf = typeof obj;
    switch (typeOf) {
      case 'undefined':
      case 'number': // ironically also NaN
      case 'string':
      case 'boolean':
      case 'symbol':
        return typeOf;
    }
    if (null === obj) {
      return 'null'; // FIXME: Is this correct?
    }
    // Custom constructors should override this with
    //    Custom.prototype[Symbot.toStringTag] = 'Custom'; // [object Custom]
    //    get [Symbol.toStringTag]() { return 'Custom'; } // [object Custom]
    const stringified = toStringTagImmediate(obj);
    if (undefined !== stringified) {
      return stringified;
    }
    if (obj.constructor && obj.constructor.name) {
      return obj.constructor.name;
    }
    // Note: `Object.create(null)` will not have a `constructor` property
    return Object.prototype.toString.call(obj).match(/^\[object (.+)\]$/)[1];
  }

  /**
   * Looks at the instance and its immediate prototype for `Symbol.toStringTag`.
   * The default behavior looks all the way up the prototype chain. This probably
   * isn’t the intent.
   *
   * @param {any} obj - any object
   * @returns {string|undefined} - the type name or `undefined`
   *
   * @private
   */
  function toStringTagImmediate(obj) {
    function tst(o) {
      if (Object.getOwnPropertySymbols(o).indexOf(Symbol.toStringTag) > -1) {
        return o[Symbol.toStringTag];
      }
    }
    return tst(obj) ? tst(Object.getPrototypeOf(obj)) : undefined;
  }

  /**
   * A pragmatic, not strictly correct interpretation of “primitive”.
   * The difference here is that `Function` and `Date` instances are
   * considered primitive.
   *
   * @param {any} value - the value to test
   * @return {boolean}
   *
   * @private
   */
  function isPrimitiveOrNull(value) {
    if (null === value) return true;
    switch (typeof value) {
      case 'undefined':
      case 'string':
      case 'number':
      case 'boolean':
      case 'symbol':
      case 'function':
        return true;
      case 'object':
        return value instanceof Date;
    }
    return false;
  }

  /**
   * Whether a value is either `null` or `undefined`.
   *
   * @param {any} value
   * @returns {boolean}
   *
   * @private
   */
  function isNullOrUndefined(value) {
    return 'undefined' === typeof value || null === value;
  }

  /**
   * Whether an object is iterable.
   *
   * @param {any} obj - any object
   * @param {boolean} [includeStrings=false] - consider `string` instances iterable (probably not what you want)
   * @returns {boolean}
   *
   * @private
   */
  function isIterable(obj, includeStrings = false) {
    if (isNullOrUndefined(obj)) return false;

    if ('function' === typeof obj[Symbol.iterator]) {
      if ('string' === typeof obj) {
        return Boolean(includeStrings);
      }
      return true;
    }
    return false;
  }

  /**
   * Duck types an object with a `next()` method.
   *
   * @param {any} obj
   * @returns {boolean}
   *
   * @private
   */
  function isIterator(obj) {
    if (isNullOrUndefined(obj)) return false;
    if ('function' === obj.next) return true;
    return false;
  }

  /**
   * Serializes a primitive value as a string. This is optimized for human
   * consumption, not machine interoperability. Thus, it uses `.toLocaleString()`
   * for `number` and `date` instances.
   *
   * @param {any} obj
   * @param {number} [trunc=50] - maximum length of `string` serialization
   * @returns {string}
   * @throws {TypeError} - unhandled type
   *
   * @private
   */
  function serialize(obj, trunc = 100) {
    // TODO: Handle synthetic Symbol.for('Restricted function property')
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
      case 'function':
        return parseFunctionSignature(obj);
      case 'boolean': // Intentional fall-through
      case 'symbol':
        return String(obj);
      case 'object':
        if (obj instanceof Date) {
          return obj.toLocaleString();
        }
        // If the object has a `toString()` method somewhere
        // on its prototype chain and it’s *not* the default
        // inhertied from `Object`, then use it.
        // Otherwise, just return an empty string.
        if (
          'function' === typeof obj.toString &&
          Object.prototype.toString !== obj.toString
        ) {
          // TODO: Is there somehting we can do here?
          //       This could get recursively complicated.
          if (Array.prototype.toString === obj.toString) {
            return '';
          }
          try {
            return truncate(obj.toString() || '');
          } catch (error) {
            return error.stack;
          }
        }
        return '';
      default:
        throw new TypeError(typeof obj);
    }
  }

  /**
   * @param {string} [msg='Missing required parameter']
   * @private
   */
  function requiredParameter(msg = 'Missing required parameter') {
    throw new ReferenceError(msg);
  }
  /**
   * Adds a `toString()` method to the instance.
   *
   * @param {any} obj
   * @param {any} toString
   * @returns
   *
   * @private
   */
  function toStringifyInstance(
    obj,
    toString = requiredParameter('Missing toString as a function')
  ) {
    return Object.defineProperty(obj, 'toString', {
      enumerable: false,
      value: toString
    });
  }

  /**
   * Parse the signature of a function.
   *
   * @param {function} fct
   * @returns {object|undefined} - an object with `name` (`string`) and `parameters` (`string[]`) properties
   * @throws {TypeError} - for a non-function
   * @see serializeFunctionSignature
   *
   * @private
   */
  function parseFunctionSignature(fct) {
    if (undefined === fct) return undefined;
    if ('function' !== typeof fct) {
      throw new TypeError(`${typeof fct} is not a function`);
    }
    const fstr = String(fct);

    const FUNCTION = /^(\*|function\*|function)? ?(.*)\((.*)\) \{? ?\n?((?:.|\n)+)/; // TODO: I don’t know why the final `}` doesn’t work
    const LAMBDA = /^(?:\((.*)\)|([^(]*)) => \{? ?\n?((?:.|\n)+)/;

    const parseParams = str => {
      const params = str.split(/, */);
      if (1 === params.length && '' === params[0]) return [];
      return params;
    };

    // Fix for RegExp issue above
    const parseBody = str => str.replace(/(?:\n|\s)*}\s*$/, '');

    const lambdas = fstr.match(LAMBDA);
    if (lambdas && lambdas.length) {
      return toStringifyInstance(
        {
          parameters: parseParams(lambdas[1] ? lambdas[1] : lambdas[2] || ''),
          body: parseBody(lambdas[3]),
          isLambda: true
        },
        () => fstr
      );
    }
    const matches = fstr.match(FUNCTION);
    if (matches && matches.length) {
      const body = parseBody(matches[4]);
      return toStringifyInstance(
        {
          name: matches[2],
          parameters: parseParams(matches[3]),
          body: body,
          isNative: /\[native code]/.test(body),
          isGenerator: '*' === matches[1] || 'function*' === matches[1]
        },
        () => fstr
      );
    }
    throw new Error(`Unable to parse ${fstr}`);
  }

  /**
   * Gets a descriptor using `Object.getOwnPropertyDescriptor()`
   * for an object’s property.
   *
   * @param {any} obj
   * @param {string} property
   * @returns {object}
   *
   * @private
   */
  function getPropertyDescriptor(obj, property) {
    const descriptor = Object.getOwnPropertyDescriptor(obj, property);
    return {
      name: String(property), // Casts Symbols as strings, `Symbol(Symbol.iterator)`
      enumerable: descriptor.enumerable,
      configurable: descriptor.configurable,
      getter: parseFunctionSignature(descriptor.get),
      setter: parseFunctionSignature(descriptor.set)
    };
  }

  /**
   * Gets the value of a property `obj[property]`. Wraps in a
   * try/catch for the corner case where `caller` and `arguments`
   * properties aren’t available in certain contexts.
   *
   * @param {any} obj - any object
   * @param {string} property - a property name
   * @returns {any} - any value or `undefined` if the
   *                  property doesn’t exist or throws an error
   * @throws {Error} - any errors that aren’t “restricted function properties”
   *
   * @private
   */
  function getPropertyValue(obj, property) {
    if (undefined === property)
      throw new ReferenceError('property must be defined');
    try {
      return obj[property];
    } catch (error) {
      if (error instanceof TypeError) {
        return RESTRICTED_FUNCTION_PROPERTY;
      }
      throw error;
    }
  }

  /**
   * Group a flat `Iterable` into fixed-sized buckets, truncating for
   * conveniece/efficiency.
   *
   * @param {Iterable<any>} itr - any `Iterable`
   * @param {number} [size=25] - the size of each bucket
   * @param {number} [maxTotal=100] - the total number items in all buckets
   * @returns {Array<Array>} - two-dimensional `Array` of buckets and values
   * @throws {TypeError} - non-`Iterable`
   *
   * @private
   */
  function groupByBuckets(itr, size = 10, maxTotal = 50) {
    if (!isIterable(itr)) throw new TypeError('Must be Iterable');
    size = Math.floor(size);
    if (size < 1) throw new TypeError('size must be positive');

    const buckets = [];
    buckets.truncated = false;
    let i = 0;
    for (const item of itr) {
      if (i >= maxTotal) {
        buckets.truncated = true;
        break;
      }
      const bucket = Math.floor(i / size);
      if (buckets[bucket]) {
        buckets[bucket].items.push(item);
      } else {
        buckets[bucket] = {
          // Zero-based index boundaries of the bucket relative to the original iterator
          bounds: [bucket * size, Math.min((bucket + 1) * size, maxTotal) - 1],
          items: [item]
        };
      }
      i++;
    }
    return buckets;
  }

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

  /**
   * @constant
   * @private
   */
  const DEFAULT_IGNORE = [];

  /**
   * {@see describe}
   *
   * @param {any} obj - any object or primitive
   * @param {Array<Object>} [ignore=DEFAULT_IGNORE] - prototypes to ignore
   * @param {Array<Object>} [history=[]] - a record of the traversal used to idenify cycles
   * @param {Array<Object>} [prototypes=[]] - prototype chain
   * @returns {Description} - a report of the types
   *
   * @private
   */
  function describe(obj, ignore = DEFAULT_IGNORE, history = [], prototypes = []) {
    /**
     * @param {Obejct} instance
     * @returns {boolean} - whether the instance’s constructor is in the ignored list
     *
     * @inner
     */
    const isIgnored = instance =>
      ignore.some(o => {
        if (instance.constructor) {
          return instance.constructor === o;
        }
        return false;
      });

    const object = { is: instanceType(obj) };

    if (isNullOrUndefined(obj) || isPrimitiveOrNull(obj)) {
      object.value = serialize(obj);
      object.isPrimitive = true;
      return object;
    }

    object.summary = serialize(obj);

    if (isIterable(obj)) {
      object.isIterable = true;
    }

    if (isIterator(obj)) {
      object.isIterator = true;
    }

    // If we’ve already proccessed this exact object
    const isCycle = history.some(o => o === obj);

    history = [...history, obj];
    // console.log(history.map(instanceType).join(' | '));
    // console.log(prototypes.map(instanceType).join(' > '));

    /**
     * Is `Array` and property is numeric.
     *
     * @param {string} name
     * @returns {boolean}
     *
     * @inner
     */
    const nonNumericArrayProperties = name =>
      !(obj instanceof Array && /\d+/.test(name));

    object.properties = [];
    for (const name of [
      ...Object.getOwnPropertyNames(obj),
      ...Object.getOwnPropertySymbols(obj)
    ].filter(nonNumericArrayProperties)) {
      // console.log('  - ' + String(name));
      const property = getPropertyDescriptor(obj, name);
      property.from = instanceType(obj);
      property.overriddenBy = overriddenBy(name, prototypes);
      const value = getPropertyValue(obj, name);
      property.is = instanceType(value);

      if (isPrimitiveOrNull(value)) {
        if (RESTRICTED_FUNCTION_PROPERTY === value) {
          property.value = value;
        } else {
          property.value = serialize(value);
        }
        property.isPrimitive = true;
      } else if (isCycle) {
        property.value = CircularReference(value);
        property.isCircular = true;
      } else {
        property.value = describe(value, ignore, history);
      }
      object.properties.push(property);
    }
    object.iterables = expandIterables(obj, prototypes, o =>
      describe(o, ignore, history)
    );
    const proto = Object.getPrototypeOf(obj);
    if (proto && !isIgnored(proto)) {
      object.prototype = describe(proto, ignore, history, [...prototypes, obj]);
    }
    return object;
  }

  /**
   *
   *
   * @param {string} name
   * @param {Object[]} prototypes
   * @returns
   *
   * @private
   */
  function overriddenBy(name, prototypes) {
    if (undefined === prototypes || 0 === prototypes.length) return undefined;
    const overrides = prototypes.filter(
      p => Object.getOwnPropertyNames(p).indexOf(name) > -1
    );
    if (0 === overrides.length) return undefined;
    return overrides.map(instanceType);
  }

  /**
   *
   *
   * @param {Object} obj
   * @param {Object[]} prototypes
   * @param {function} desc
   * @returns {Iterable<any>}
   *
   * @private
   */
  function expandIterables(obj, prototypes, desc) {
    const shouldIterate =
      isIterable(obj) && 0 === prototypes.slice(1).filter(isIterable).length;
    // console.log(
    //   [obj, ...prototypes]
    //     .map(p => `${instanceType(p)}: ${isIterable(p)}`)
    //     .join(' > '),
    //   shouldIterate
    // );
    if (shouldIterate) {
      try {
        const buckets = groupByBuckets(obj);
        return Object.assign(
          buckets.map(bucket => ({
            bounds: bucket.bounds,
            items: bucket.items.map(item => desc(item))
          })),
          { truncated: buckets.truncated }
        );
      } catch (error) {
        // return error.stack.split(/\n/);
        // "TypeError: Method [Generator].prototype.next called on incompatible receiver [object Generator]",
        // "    at next (<anonymous>)",
        // "    at groupByBuckets (/MarkLogic/appservices/qconsole/util.js:351:19)",
        // "    at expandIterables (/MarkLogic/appservices/qconsole/describe.js:144:23)",
        // "    at describe (/MarkLogic/appservices/qconsole/describe.js:115:22)",
        // "    at describe (/MarkLogic/appservices/qconsole/describe.js:119:24)",
        // "    at module.exports.describe (/MarkLogic/appservices/qconsole/describe.js:184:10)",
        // "    at eval (eval at <anonymous> (/MarkLogic/appservices/qconsole/qconsole-js-amped.sjs:42:17), <anonymous>:3:1)",
        // "    at /MarkLogic/appservices/qconsole/qconsole-js-amped.sjs:42:17",
        // "    at /MarkLogic/appservices/qconsole/qconsole-js-amped.sjs:30:21",
        // "    at /MarkLogic/appservices/qconsole/qconsole-js-amped.sjs:32:25"
        // TODO: There must be a cleaner way to do this
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * @constructor
   *
   * @param {any} reference
   * @returns
   *
   * @private
   * @since 0.1.0
   */
  function CircularReference(reference) {
    if (!(this instanceof CircularReference)) {
      return new CircularReference(reference);
    }
    Object.defineProperty(this, 'reference', {
      get() {
        return reference;
      }
    });
  }
  CircularReference.prototype.constructor = CircularReference;
  CircularReference.prototype.toString = function toString() {
    return 'Circular: ' + serialize(this.reference);
  };

  /**
   * Recursively traverses an object’s properties, including along
   * its prototype chain. Handles cycles.
   *
   * @name describe
   * @param {any} obj - any object or primitive
   * @param {Array<Object>} [ignore=DEFAULT_IGNORE] - prototypes to ignore
   * @returns {Description} - a report of the types
   *
   * @since 0.1.0
   */
  function describe$1(obj, ignore = []) {
    // Prevent external function from calling `describe` with more
    // than two arguments, i.e. overriding the `history` parameter.
    return describe(obj, ignore);
  }

  /**
   * Description goes here
   * @typedef {Object} ObjectDescription
   *
   * @property {string} is - the name of the object’s type
   * @property {string} summary - a short summary of a potentially complicated object hierarchy
   * @property {boolean} [isIterable] - whether an object, all the way along its prototype chain, is iterable
   * @property {ObjectDescription[]|PrimitiveDescription[]} properties - all of the instance’s own propties and symbols
   * @property {ObjectDescription} [prototype] - the instance’s prototype
   *
   * @since 0.1.0
   */

  /**
   * Description goes here
   * @typedef {Bucket[]} IterablesDescription
   *
   * @property {boolean} truncated - whether the underlying iterable has been truncated
   *
   * @since 0.1.0
   */

  /**
   * Description goes here
   * @typedef {Object} Bucket
   *
   * @property {number[]} bounds - lower and upper bounds of bucket relative to the iteratable
   * @property {ObjectDescriptor[]} items
   *
   * @since 0.1.0
   */

  /**
   * Description goes here
   * @typedef {Object} FunctionDescription
   *
   * @property {string} is - the name of the object’s type
   * @property {Object[]} properties
   * @property {Object} prototype
   *
   * @since 0.1.0
   */

  /**
   * Description goes here
   * @typedef {Object} PropertyDescription
   *
   * @example
   * {
   *   "name": "str",
   *   "enumerable": true,
   *   "configurable": true,
   *   "from": "Object",
   *   "is": "string",
   *   "value": "\"string\"",
   *   "isPrimitive": true
   * },
   *
   * @property {string} name - the name of the property
   * @property {boolean} enumerable - whether it’s enumerable, as defined in `Object.defineProperty()`
   * @property {string} configurable - whether it’s configurable, as defined in `Object.defineProperty()`
   * @property {string} from - the type name of the object on which it was defined
   * @property {ObjectDescription|FunctionDescription|string} is - the name of the object’s type
   * @property {string} value - the serialized value
   * @property {boolean} isPrimitive - `true`
   *
   * @since 0.1.0
   */

  return describe$1;

}());
