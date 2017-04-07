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
  instanceType,
  getPropertyDescriptor,
  getPropertyValue,
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
 * @returns {Object} - a report of the types
 */
function describe(obj, ignore = DEFAULT_IGNORE, history = []) {
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

  // If we’ve already proccessed this exact object
  const isCycle = history.some(o => o === obj);
  history = [...history, obj];

  object.properties = [];
  for (const name of [
    ...Object.getOwnPropertyNames(obj),
    ...Object.getOwnPropertySymbols(obj),
  ]) {
    const property = getPropertyDescriptor(obj, name);
    property.from = instanceType(obj); // What is this really supposed to convey?
    // console.log(`${obj.constructor.name}: ${name}`);
    const value = getPropertyValue(obj, name);
    if (isPrimitiveOrNull(value)) {
      property.value = serialize(value);
      property.is = instanceType(value);
    } else if (isCycle) {
      property.value = CircularReference(value);
      property.isCircular = true;
      // } else if (isIgnored(value)) {
      //   // throw new Error('ignored');
      //   property.value = 'IGNORED';
    } else {
      property.value = describe(value, ignore, history);
    }
    object.properties.push(property);
  }
  const proto = Object.getPrototypeOf(obj);
  if (proto && !isIgnored(proto)) {
    // Concat the prototype properties to the current object’s
    // object.properties = [
    //   ...object.properties,
    //   ...describe(proto, ignore, history).properties,
    // ];
    object.prototype = describe(proto, ignore, history);
  }
  return object;
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
