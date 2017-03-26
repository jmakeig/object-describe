'use strict';

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
    case 'function': // Object.prototype.toString.call(function*(){}) => GeneratorFunction. Should we do more here?
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
 * Whether a value is a primitive or an `Object`.
 *
 * @param {any} value - the value to test
 * @return {boolean}  
 */
function isPrimitiveOrNull(value) {
  return null === value || 'object' !== typeof value;
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
function isIterable(obj, includeStrings) {
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
 * Serializes a primitive value as a string. This is optimized for human
 * consumption, not machine interoperability. Thus, it uses `.toLocaleString()`
 * for `number` and `date` instances.
 * 
 * @param {any} obj 
 * @param {number} trunc - maximum length of `string` serialization 
 * @returns {string}
 * @throws {TypeError} - non-primitive
 */
// eslint-disable-next-line consistent-return
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
      if (obj instanceof Date) {
        return obj.toLocaleString();
      }
      break;
    default:
      throw new TypeError('Can’t format objects');
  }
}

module.exports.instanceType = instanceType;
module.exports.isPrimitiveOrNull = isPrimitiveOrNull;
module.exports.isNullOrUndefined = isNullOrUndefined;
module.exports.isArrayLike = isArrayLike;
module.exports.isIterable = isIterable;
module.exports.serializePrimitive = serializePrimitive;
// module.exports.getNonArrayLikeOwnPropertyNames = getNonArrayLikeOwnPropertyNames;
