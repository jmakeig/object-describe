'use strict';


// FIXME: NO! NO! NO! Library modules *must* support relative imports using `./`
const util = require('src/util.js');
// FIXME: NO! NO! NO! Library modules *must* support relative imports using `./`
const render = require('src/render.js');

/**
 * Generates a report on an object’s properties and types, 
 * including along the prototype hierarchy.
 * 
 * @example <caption>Output for <code>{a: 'A', b: ['B', 'B']}</code></caption>
 * {
 *   "instanceOf": "Object",
 *   "properties": [
 *     {
 *       "name": "a",
 *       "value": "A",
 *       "instanceOf": "string",
 *       "isEnumerable": true
 *     },
 *     {
 *       "name": "b",
 *       "value": {
 *         "instanceOf": "Array",
 *         "properties": [
 *           {
 *             "name": "0",
 *             "value": "B",
 *             "instanceOf": "string",
 *             "isEnumerable": true
 *           },
 *           {
 *             "name": "1",
 *             "value": "B",
 *             "instanceOf": "string",
 *             "isEnumerable": true
 *           },
 *           {
 *             "name": "length",
 *             "value": "2",
 *             "instanceOf": "number",
 *             "isEnumerable": false,
 *             "overrideOf": "Array"
 *           },
 *           {
 *             "name": "length",
 *             "value": "0",
 *             "instanceOf": "number",
 *             "from": "Array",
 *             "isEnumerable": false,
 *             "isOverridden": true
 *           },
 *           {
 *             "name": "constructor",
 *             "value": "function Array() { [native code] }",
 *             "instanceOf": "function",
 *             "from": "Array",
 *             "isEnumerable": false,
 *             "overrideOf": "Object"
 *           },
 *           {
 *             "name": "toString",
 *             "value": "function toString() { [native code] }",
 *             "instanceOf": "function",
 *             "from": "Array",
 *             "isEnumerable": false,
 *             "overrideOf": "Object"
 *           },
 *           // …
 *           {
 *             "name": "Symbol(Symbol.unscopables)",
 *             "value": {
 *               "instanceOf": "Object",
 *               "properties": [
 *                 // …
 *               ]
 *             },
 *             "instanceOf": "Object",
 *             "from": "Array",
 *             "isEnumerable": false
 *           },
 *           {
 *             "name": "Symbol(Symbol.iterator)",
 *             "value": "function values() { [native code] }",
 *             "instanceOf": "function",
 *             "from": "Array",
 *             "isEnumerable": false
 *           },
 *           {
 *             "name": "__defineGetter__",
 *             "value": "function __defineGetter__() { [native code] }",
 *             "instanceOf": "function",
 *             "from": "Object",
 *             "isEnumerable": false
 *           },
 *           // …
 *         ]
 *       },
 *       "instanceOf": "Array",
 *       "isEnumerable": true
 *     },
 *     {
 *       "name": "__defineGetter__",
 *       "value": "function __defineGetter__() { [native code] }",
 *       "instanceOf": "function",
 *       "from": "Object",
 *       "isEnumerable": false
 *     },
 *     // …
 *   ]
 * }
 * 
 * @param {any} obj 
 * @param {boolean|number} [expandIterables] - whether to automatically expand
 * @returns 
 */
function describe(obj, expandIterables) {
  const top = obj;
  const report = {
    instanceOf: util.instanceType(obj)
  };
  if (util.isPrimitiveOrNull(obj)) {
    report.value = render.serializePrimitive(obj);
  }
  const props = [];

  if (util.isIterable(obj) && expandIterables) {
    report.iterableValues = [];
    if ('boolean' === typeof expandIterables) {
      expandIterables = Number.POSITIVE_INFINITY;
    }
    if (!('number' === typeof expandIterables)) {
      throw new TypeError();
    }
    if (
      !Number.isInteger(expandIterables) && Number.isFinite(expandIterables)
    ) {
      throw new TypeError('Must be a finite integer or infinity');
    }
    let j = 0;
    for (const item of obj) {
      if (j++ < expandIterables) {
        report.iterableValues.push(describe(item));
      } else {
        report.iterableValues.truncated = true;
        break;
      }
    }
  }

  do {
    // Capture properties and symbols
    const propsAndSymbols = [].concat(
      //getNonArrayLikeOwnPropertyNames(obj),
      Object.getOwnPropertyNames(obj),
      Object.getOwnPropertySymbols(obj)
    );
    for (const prop of propsAndSymbols) {
      const p = { name: String(prop) };
      const value = obj[prop];

      if (util.isPrimitiveOrNull(value)) {
        p.value = String(value);
      } else {
        p.value = describe(value);
      }

      p.instanceOf = util.instanceType(value); //p.value.instanceOf ? p.value.instanceOf : 'BLAH'
      // Where this property is declared
      if (top !== obj && obj !== Object.getPrototypeOf(obj)) {
        p.from = util.instanceType(obj);
      }
      p.isEnumerable = obj.propertyIsEnumerable
        ? obj.propertyIsEnumerable(prop)
        : undefined;

      // If there’s already a property lower on the prototype chain
      // then this property has been overridden.
      const overrides = props.filter(pr => pr.name === prop);
      if (overrides.length > 0) {
        p.isOverridden = true;
        if (1 === overrides.length) {
          overrides[0].overrideOf = p.from;
        }
      }
      props.push(p);
    }
  } while (obj = Object.getPrototypeOf(obj));
  report.properties = props;
  return report;
}

module.exports.describe = describe;
