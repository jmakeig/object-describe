'use strict';

function instanceType(obj) {
  switch (typeof obj) {
    case 'undefined':
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
  if (obj.constructor && obj.constructor.name) {
    return obj.constructor.name;
  }
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
    case 'string':
    case 'number':
    case 'date':
    case 'boolean':
    case 'function':
    case 'symbol':
      return true;
    case 'object':
      return null === value;
  }
}

function isNullOrUndefined(value) {
  return 'undefined' === typeof value || null === value;
}

/**
 * Poor man’s Iterable interface. Captures `Array` and 
 * `String` instances.
 */
function isArrayLike(obj) {
  if(isNullOrUndefined(obj)) return false;
  return 'number' === typeof obj.length;
}

function getNonArrayLikeOwnPropertyNames(obj) {
  if(isNullOrUndefined(obj)) return [];
  
  const props = Object.getOwnPropertyNames(obj);
  if(isArrayLike(obj)) {
    return props.filter(prop => !(/\d+/.test(prop)));
  }
  return props;
}

function describe(obj) {
  const report = { 
    instanceOf: instanceType(obj), 
  };
  if(isPrimitiveOrNull(obj)) {
    report.value = String(obj);
  }
  const props = [];
  do {
    // Capture properties and symbols
    const propsAndSymbols = [].concat(
      getNonArrayLikeOwnPropertyNames(obj),
      Object.getOwnPropertySymbols(obj)
    );
    for (const prop of propsAndSymbols) {
      const p = { name: String(prop) };
      const value = obj[prop];
      
      if(isPrimitiveOrNull(value)) {
        p.value = String(value);
      } else {
        p.value = describe(value);
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
      props.push(p);
    }
  } while (obj = Object.getPrototypeOf(obj));
  report.properties = props;
  return report;
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

const descrip = describe(obj.a);
descrip



