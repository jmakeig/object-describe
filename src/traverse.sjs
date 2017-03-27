'use strict';

const {
  isPrimitiveOrNull,
  isNullOrUndefined,
  instanceType,
  getPropertyDescriptor,
  serialize,
} = require('./util');

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
function getProperty(obj, property) {
  try {
    return obj[property];
  } catch (error) {
    if (
      error instanceof TypeError &&
      /restricted function properties/.test(error.message)
    ) {
      return undefined;
    }
    throw error;
  }
}

/**
 * @constructor
 * 
 * @param {any} history 
 * @returns 
 */
function CycleError(history) {
  // <http://www.2ality.com/2011/12/subtyping-builtins.html>
  function copyOwnFrom(target, source) {
    Object.getOwnPropertyNames(source).forEach(function(propName) {
      Object.defineProperty(
        target,
        propName,
        Object.getOwnPropertyDescriptor(source, propName)
      );
    });
    return target;
  }
  const superInstance = Error.call(this);
  copyOwnFrom(this, superInstance);
  // Error.captureStackTrace(this);
  Object.defineProperty(this, 'history', {
    get() {
      return history;
    },
  });
  Object.defineProperty(this, 'message', {
    get() {
      return history
        .map(o => o.constructor.name + (o.name ? `#${o.name}` : ''))
        .join(', ');
    },
  });
  this.name = 'CycleError';
}
CycleError.prototype = Object.create(Error.prototype);
CycleError.constructor = CycleError;

/**
 * @constructor
 * 
 * @param {any} reference 
 * @returns 
 */
function CircularReference(reference) {
  if (!(this instanceof CircularReference)) {
    return new CircularReference(reference);
  }
  Object.defineProperty(this, 'reference', {
    get() {
      return reference;
    },
  });
}
CircularReference.prototype.constructor = CircularReference;
CircularReference.prototype.toString = function toString() {
  return 'CIRCULAR: '; // + String(this.reference);
};

/**
 * Recursively traverses an object’s properties, including along
 * its prototype chain. Handles cycles 
 * 
 * @param {any} obj - any object or primitive
 * @param {any} [history=[]] - a record of the traversal used to idenify cycles
 * @returns {object} - a report of the types
 */
function traverse(obj, history = []) {
  if (isNullOrUndefined(obj) || isPrimitiveOrNull(obj)) {
    return serialize(obj);
  }

  // If we’ve already proccessed this exact object
  const isCycle = history.some(o => o === obj);
  history = [...history, obj];

  const object = { is: instanceType(obj) };
  object.properties = [];
  for (const name of [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj),
  ]) {
    const property = getPropertyDescriptor(obj, name);
    property.from = instanceType(obj); // What is this really supposed to convey?
    // console.log(`${obj.constructor.name}: ${name}`);
    const value = getProperty(obj, name);
    if (isPrimitiveOrNull(value)) {
      property.value = value;
    } else if (isCycle) {
      property.value = CircularReference(value).toString(); // FIXME
    } else {
      property.value = traverse(value, history);
    }
    object.properties.push(property);
  }
  const proto = Object.getPrototypeOf(obj);
  if (proto) {
    object.properties = [...object.properties, traverse(proto, history)];
  }
  return object;
}

module.exports = { traverse };
