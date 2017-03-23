'use strict';

const util = require('./util.js');
const render = require('./render.js');

/**
 * Generates a report on an object’s properties and types, 
 * including along the prototype hierarchy.
 * 
 * @example <caption>Output for <code>{a: 'A', b: ['B', 'B']}</code></caption>
 * TODO
 * 
 * @param {any} obj 
 * @param {boolean|number} [expandIterables=50] - whether to automatically expand
 * @returns 
 */
function describe(obj /* , expandIterables */) {
  const report = {
    instanceOf: util.instanceType(obj),
    properties: [],
  };
  // Primitive
  if (util.isPrimitiveOrNull(obj)) {
    report.value = render.serializePrimitive(obj);
    if (util.isNullOrUndefined(obj)) {
      return report;
    }
  }

  /*
  // Iterables
  if (expandIterables && util.isIterable(obj)) {
    if (undefined === expandIterables || true === expandIterables) {
      expandIterables = 50;
    }
    if (!('number' === typeof expandIterables)) {
      throw new TypeError();
    }
    if (
      !Number.isInteger(expandIterables) && Number.isFinite(expandIterables)
    ) {
      throw new TypeError('Must be a finite integer or infinity');
    }
    report.iterableValues = [];
    let j = 0;
    for (const item of obj) {
      if (j++ < expandIterables) {
        report.iterableValues.push(describe(item, expandIterables));
      } else {
        report.iterableValues.truncated = true;
        break;
      }
    }
  }
*/

  // Properties
  const propsAndSymbols = [].concat(
    Object.getOwnPropertyNames(obj),
    Object.getOwnPropertySymbols(obj)
  );
  for (const prop of propsAndSymbols) {
    const p = { name: String(prop) };
    let value;
    try {
      value = obj[prop];
    } catch (error) {
      // TypeError: 'caller' and 'arguments' are restricted function properties and cannot be accessed in this context.
      if (
        error instanceof TypeError &&
        /restricted function properties/.test(error.message)
      ) {
        value = Symbol.for('Restricted function property');
      } else {
        throw error;
      }
    }

    if (util.isPrimitiveOrNull(value)) {
      p.value = render.serializePrimitive(value);
    } else {
      p.value = describe(value);
    }

    p.instanceOf = util.instanceType(value);
    p.from = util.instanceType(obj);

    const descriptor = Object.getOwnPropertyDescriptor(obj, prop);

    p.enumerable = descriptor.enumerable;
    p.configurable = descriptor.configurable;
    p.getter = parseFunctionSignature(descriptor.get);
    p.setter = parseFunctionSignature(descriptor.set);

    // TODO: Figure out how to capture overrides
    // If there’s already a property lower on the prototype chain
    // then this property has been overridden.
    // const overrides = report.properties.filter(pr => pr.name === prop);
    // if (overrides.length > 0) {
    //   p.isOverridden = true;
    //   if (1 === overrides.length) {
    //     overrides[0].overrideOf = p.from;
    //   }
    // }

    report.properties.push(p);
  }
  const proto = Object.getPrototypeOf(obj);
  if (proto) report.prototype = describe(proto);

  return report;
}

/**
 * Parse the signature of a function.
 * 
 * @param {function} fct 
 * @returns {object|undefined} - an object with `name` (`string`) and `parameters` (`string[]`) properties
 * @see serializeFunctionSignature
 */
function parseFunctionSignature(fct) {
  const fstr = String(fct);
  const matches = fstr.match(/^(?:function)? ?(.*)\(([^)]*)\)/); // <https://www.debuggex.com/r/_Xe44X7puf9pODB1>
  if (matches && matches.length) {
    return {
      name: matches[1],
      parameters: matches[2].split(/, */),
    };
  }
  return undefined;
}

module.exports.describe = describe;
