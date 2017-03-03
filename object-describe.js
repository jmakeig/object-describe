'use strict';

function instanceType(obj) {
  switch (typeof obj) {
    case 'number':
    case 'string':
    case 'boolean':
    case 'function':
    case 'symbol':
      return typeof obj;
  }
  if (null === obj) {
    return 'null';
  }
  if (undefined === obj) {
    return 'undefined';
  }
  if (obj.constructor && obj.constructor.name) {
    return obj.constructor.name;
  }
  return Object.prototype.toString.call(obj).match(/^\[object (.+)\]$/)[1]; // [object Object] // Object
}

function describe(obj) {
  const props = [];
  const inst = instanceType(obj);
  do {
    const propsAndSymbols = [].concat(
      Object.getOwnPropertyNames(obj),
      Object.getOwnPropertySymbols(obj)
    );
    for (const prop of propsAndSymbols) {
      const p = { name: prop };
      const value = obj[prop];
      switch (typeof value) {
        case 'string':
        case 'number':
        case 'date':
        case 'boolean':
        case 'function':
        case 'symbol':
          // Don’t recurse for primitive properties. Is this a feature or a bug?
          // `describe(primitive)` will still recurse.
          p.value = String(value);
          break;
        case 'object':
          if (null === value || undefined === value) {
            p.value = String(value);
          } else {
            p.value = describe(value);
          }
          break;
      }

      p.typeOf = typeof obj[prop];
      p.from = instanceType(obj);
      p.isEnumerable = obj.propertyIsEnumerable
        ? obj.propertyIsEnumerable(prop)
        : undefined;

      // If there’s already a property lower on the prototype chain
      // then this property has been overridden.
      const overrides = props.filter(pr => pr.name === prop);
      if (overrides.length > 0) {
        p.overridden = true;
        if (1 === overrides.length) {
          overrides[0].overrideOf = p.from;
        }
      }

      // Ignore numeric properties for Arrays and Strings.
      if (
        ('string' === typeof obj || Array.isArray(obj)) &&
        /\d+/.test(String(prop))
      ) {
      } else {
        props.push(p);
      }
    }
  } while (obj = Object.getPrototypeOf(obj));
  return { instanceOf: inst, properties: props };
}

const obj = { a: 'A', b: [1, 2, 3], c: null, d: Date.now(), e: undefined };

function Foo() {}
Foo.prototype.fff = function() {};
Foo.prototype[Symbol.toStringTag] = 'Foo';
const foo = new Foo();

const dict = Object.create(null);
dict['a'] = 'A';
dict.constructor === undefined; // true

class Bar extends Foo {
  bbb() {}
  fff() {}
}
const bar = new Bar();
bar.obj = obj;

const baz = Object.create(Bar.prototype);

describe(baz);

