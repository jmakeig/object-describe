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
const deepEqual = require('/mltap/_modules/deep-equal/index');

/**
 * 
 * 
 * @param {Set} aaa 
 * @param {Set} bbb 
 * @param {function} [comparator] 
 * @returns {boolean}
 */
function equalSets(aaa, bbb, comparator = (x, y) => x === y) {
  if ('function' !== typeof comparator) {
    throw new TypeError(typeof comparator);
  }
  if (!(aaa instanceof Set) || !(bbb instanceof Set)) return false;
  if (aaa.size !== bbb.size) return false;
  for (const itemA of aaa) {
    let hasB = false;
    for (const itemB of bbb) {
      hasB = comparator(itemA, itemB);
      if (hasB) {
        // Is this more expensive than brute force?
        return equalSets(
          cloneWithout(aaa, itemA),
          cloneWithout(bbb, itemB),
          comparator
        );
      }
    }
    if (!hasB) return false;
  }
  return true;
}

/**
 * Clones a new set with a specific entry.
 * Doesn’t modify `set`.
 * 
 * @param {Set} set 
 * @param {any} entry 
 * @returns {Set}
 * @throws {TypeError}
 */
function cloneWithout(set, entry) {
  if (!(set instanceof Set)) {
    throw new TypeError(String(set));
  }
  const clone = new Set(set);
  if (undefined !== entry) {
    clone.delete(entry);
  }
  return clone;
}

/**
 * Given an object and a collection of key names, create a shallow
 * copy with only the keys specified in the key names collection. Or
 * all the keys *not* in the collection when the `inverse` flag is set
 * to `true`.
 * 
 * @example
 * select({a: 'A', b: 'B', c: 'C'}, ['b', 'c']); // {b: 'B', c: 'C'}
 * select({a: 'A', b: 'B', c: 'C'}, ['b', 'c'], true); // {a: 'A'}
 *
 * @param {object} obj - any object
 * @param {[string[]]} - a list of key names from `obj`
 * @param {[boolean]} - whether to discard the listed keys, rather than keeping them
 * @return {object} - a shallow copy of `obj` with a subset of the keys
 */
function select(obj, keys, inverse) {
  if (null === obj || undefined === obj) return obj;
  const out = inverse ? Object.assign({}, obj) : {};
  if (!keys) return Object.assign(out, obj);
  for (const key of keys) {
    if (inverse) {
      delete out[key];
    } else {
      out[key] = obj[key];
    }
  }
  return out;
}

module.exports.deepEqualSets = (a, b) => equalSets(a, b, deepEqual);
module.exports.select = select;
