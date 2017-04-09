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

const {
  isPrimitiveOrNull,
  isNullOrUndefined,
  isIterable,
  isIterator,
  instanceType,
  getPropertyDescriptor,
  getPropertyValue,
  RESTRICTED_FUNCTION_PROPERTY,
  groupByBuckets,
  serialize,
} = require('./util');

const DEFAULT_IGNORE = [];

/**
 * Recursively traverses an object’s properties, including along
 * its prototype chain. Handles cycles 
 * 
 * @param {any} obj - any object or primitive
 * @param {Array<Object>} [ignore=DEFAULT_IGNORE] - prototypes to ignore
 * @param {Array<Object>} [history=[]] - a record of the traversal used to idenify cycles
 * @param {Array<Object>} [prototypes=[]] - prototype chain
 * @returns {Object} - a report of the types
 */
function describe(obj, ignore = DEFAULT_IGNORE, history = [], prototypes = []) {
  /**
   * 
   * @param {Obejct} instance 
   * @returns {boolean} - whether the instance’s constructor is in the ignored list
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
    return object;
  }
  if (isIterable(obj) && 0 === history.length) {
    object.isIterable = true;
  }

  if (isIterator(obj)) {
    object.isIterator = true;
  }

  // const shouldIterate = history.reduceRight((prev, curr) => true, false);

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
   */
  const nonNumericArrayProperties = name =>
    !(obj instanceof Array && /\d+/.test(name));

  object.properties = [];
  for (const name of [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj),
  ].filter(nonNumericArrayProperties)) {
    // console.log('  - ' + String(name));
    const property = getPropertyDescriptor(obj, name);
    property.from = instanceType(obj); // What is this really supposed to convey?
    const value = getPropertyValue(obj, name);
    property.is = instanceType(value);

    if (isPrimitiveOrNull(value)) {
      if (RESTRICTED_FUNCTION_PROPERTY === value) {
        property.value = value;
      } else {
        property.value = serialize(value);
      }
    } else if (isCycle) {
      property.value = CircularReference(value);
      property.isCircular = true;
    } else {
      property.value = describe(value, ignore, history);
    }
    object.properties.push(property);

    object.iterables = expandIterables(obj, prototypes, o =>
      describe(o, ignore, history));
  }

  const proto = Object.getPrototypeOf(obj);
  if (proto && !isIgnored(proto)) {
    object.prototype = describe(proto, ignore, history, [...prototypes, obj]);
  }
  return object;
}

/**
 * 
 * 
 * @param {Object} obj 
 * @param {Object[]} prototypes 
 * @param {function} desc
 * @returns {Iterable<any>}
 */
function expandIterables(obj, prototypes, desc) {
  // console.log('      ' + prototypes.map(instanceType).join(' > '));

  // Has something higher up on the prototype chain alredy implemented Iterable?
  // If something higher isn’t Iterable and the current object is
  // history[history.length - 1] === obj, necessarily
  const shouldIterate = isIterable(obj);

  if (shouldIterate) {
    // TODO: There must be a cleaner way to do this
    const buckets = groupByBuckets(obj);
    return Object.assign(
      buckets.map(bucket => ({
        bounds: bucket.bounds,
        items: bucket.items.map(item => desc(item)),
      })),
      { truncated: buckets.truncated }
    );
  }
  return undefined;
}

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
  return 'Circular: ' + serialize(this.reference);
};

// Prevent external function from calling `describe` with more
// than two arguments, i.e. overriding the `history` parameter.
module.exports.describe = function(obj, ignore = []) {
  return describe(obj, ignore);
};
