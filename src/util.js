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
/**
 * @constant
 */
const RESTRICTED_FUNCTION_PROPERTY = Symbol('RESTRICTED_FUNCTION_PROPERTY');

/**
 * Get the type of any object. Primitives return primitive name.
 * Objects use `constructor.name` or fallback to `Object.prototype.toString()`. 
 * 
 * @param {any} obj  - any object or primitive, including `null` and `undefined`
 * @returns {string} - the type of the objet
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
 */
function isNullOrUndefined(value) {
  return 'undefined' === typeof value || null === value;
}

/**
 * Poor man’s Iterable interface. Captures `Array` and `String`.
 * 
 * @param {any} obj 
 * @returns {boolean}
 */
function isArrayLike(obj) {
  if (isNullOrUndefined(obj)) return false;
  if (Array.isArray(obj)) return true;
  return 'number' === typeof obj.length && obj.length >= 0;
}

/**
 * Whether an object is iterable.
 * 
 * @param {any} obj - any object
 * @param {boolean} [includeStrings=false] - consider `string` instances iterable (probably not what you want)
 * @returns {boolean}
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
 * @throws {TypeError} - non-primitive
 */
// eslint-disable-next-line consistent-return
function serialize(obj, trunc = 50) {
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
      break;
    default:
      throw new TypeError('Can’t format objects');
  }
}

/**
 * Whether the object is a function, using `instanceof`.
 * 
 * @example
 * Object.getPrototypeOf(       // null
 *   Object.getPrototypeOf(     // Object
 *     Object.getPrototypeOf(   // Function
 *       Object.getPrototypeOf( // (Generator)Function
 *         function(){}
 *       )
 *     )
 *   )
 * )
 * 
 * @param {any} obj 
 * @returns {boolean}
 */
function isFunction(obj) {
  return obj instanceof Function;
}

function requiredParameter(msg = 'Missing required parameter') {
  throw new ReferenceError(msg);
}
/**
 * Adds a `toString()` method to the instance.
 * 
 * @param {any} obj 
 * @param {any} toString 
 * @returns 
 */
function toStringifyInstance(
  obj,
  toString = requiredParameter('Missing toString as a function')
) {
  return Object.defineProperty(obj, 'toString', {
    enumerable: false,
    value: toString,
  });
}

/**
 * Parse the signature of a function.
 * 
 * @param {function} fct 
 * @returns {object|undefined} - an object with `name` (`string`) and `parameters` (`string[]`) properties
 * @throws {TypeError} - for a non-function
 * @see serializeFunctionSignature
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
        isLambda: true,
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
        isGenerator: '*' === matches[1] || 'function*' === matches[1],
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
 */
function getPropertyDescriptor(obj, property) {
  const descriptor = Object.getOwnPropertyDescriptor(obj, property);
  return {
    name: String(property), // Casts Symbols as strings, `Symbol(Symbol.iterator)`
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    getter: parseFunctionSignature(descriptor.get),
    setter: parseFunctionSignature(descriptor.set),
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
 */
function getPropertyValue(obj, property) {
  if (undefined === property)
    throw new ReferenceError('property must be defined');
  try {
    return obj[property];
  } catch (error) {
    if (
      error instanceof TypeError &&
      /restricted function properties/.test(error.message)
    ) {
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
        items: [item],
      };
    }
    i++;
  }
  return buckets;
}

module.exports = {
  instanceType,
  isPrimitiveOrNull,
  isNullOrUndefined,
  isArrayLike,
  isIterable,
  isIterator,
  isFunction,
  serialize,
  parseFunctionSignature,
  getPropertyDescriptor,
  getPropertyValue,
  RESTRICTED_FUNCTION_PROPERTY,
  groupByBuckets,
};
