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
    case 'number':
    case 'string':
    case 'boolean':
    case 'function':
    case 'symbol':
      return typeOf;
  }
  if (null === obj) {
    return 'Object'; // FIXME: Is this correct?
  }
  if (obj.constructor && obj.constructor.name) {
    return obj.constructor.name;
  }
  // Note: `Object.create(null)` will not have a `constructor` property
  return Object.prototype.toString.call(obj).match(/^\[object (.+)\]$/)[1]; // [object Object] // Object
}

/**
 * Whether a value is a primitive or an `Object`.
 *
 * @param {any} value - the value to test
 * @return {boolean}  
 */
function isPrimitiveOrNull(value) {
  switch (typeof value) {
    case 'undefined':
    case 'number':
    case 'string':
    case 'boolean':
    case 'function':
    case 'symbol':
      return true;
    case 'object':
      return null === value;
    default:
      throw new TypeError(`${typeof value} is not a valid type`);
  }
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
  return 'number' === typeof obj.length;
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
 * Get the property names that aren’t numeric using
 * `Object.getOwnPropetyNames()`.
 * 
 * @param {any} obj 
 * @returns {strng[]}
 */
function getNonArrayLikeOwnPropertyNames(obj) {
  if (isNullOrUndefined(obj)) return [];

  const props = Object.getOwnPropertyNames(obj);
  if (isArrayLike(obj)) {
    return props.filter(prop => !/\d+/.test(prop));
  }
  return props;
}

module.exports.instanceType = instanceType;
module.exports.isPrimitiveOrNull = isPrimitiveOrNull;
module.exports.isNullOrUndefined = isNullOrUndefined;
module.exports.isArrayLike = isArrayLike;
module.exports.isIterable = isIterable;
// module.exports.getNonArrayLikeOwnPropertyNames = getNonArrayLikeOwnPropertyNames;
