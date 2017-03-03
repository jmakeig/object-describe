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

// Segfault in Number.prototype.toLocaleString()
function serializePrimitiveXXX(obj, trunc) {
  trunc = trunc || 50;
  function truncate(str) {
    let suffix = '';
    if(str.length > trunc) suffix = '…';
    return str.substring(0, trunc) + suffix;
  }
  if(null === obj) return 'null';
  switch(typeof obj) {
    case 'undefined':
      return 'undefined';
    case 'string':
      return `"${truncate(obj)}"`;
    case 'number':
      if(Number.isNaN(obj)) return 'NaN';
      return obj.toLocaleString();
    case 'date':
      return obj.toLocaleString();
    case 'boolean':
    case 'function':
    case 'symbol':
      return String(boolean);
    case 'object':
      throw new TypeError('Can’t format objects');
  }
}

function isIterable(obj) {
  return 'function' === typeof obj[Symbol.iterator];
}


function describe(obj, expandIterables) {
  const top = obj;
  const report = { 
    instanceOf: instanceType(obj), 
  };
  if(isPrimitiveOrNull(obj)) {
    report.value = String(obj);
  }
  const props = [];
  
  if(isIterable(obj) && expandIterables) {
    report.iterableValues = [];
    if('boolean' === typeof expandIterables) { expandIterables = Number.POSITIVE_INFINITY; }
    if(!('number' === typeof expandIterables)) { throw new TypeError(); }
    if(!Number.isInteger(expandIterables) && Number.isFinite(expandIterables)) {
      throw new TypeError('Must be a finite integer or infinity');
    }
    let j = 0;
    for(const item of obj) {
      if(j++ < expandIterables) {
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
      
      if(isPrimitiveOrNull(value)) {
        p.value = String(value);
      } else {
        p.value = describe(value);
      }
      
      p.instanceOf = instanceType(value); //p.value.instanceOf ? p.value.instanceOf : 'BLAH'
      // Where this property is declared
      if(top !== obj && obj !== Object.getPrototypeOf(obj)) {
        p.from = instanceType(obj);
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


function renderProperty(prop) {
    return `<div class="property ${prop.isEnumerable ? 'is-enumerable' : ''} ${prop.overrideOf ? 'is-override' : ''} ${prop.isOverridden ? 'is-overridden' : ''} typeof-${prop.instanceOf}">
  <span class="name">${prop.name}</span> 
  ${prop.from ? `<span class="from">from ${prop.from}</span> ` : ''}
  ${prop.overrideOf ? `<span class="override-of">overrides ${prop.overrideOf}</span> ` : ''}
  <span class="instance-of">${prop.instanceOf}</span> 
  <span class="value">${isPrimitiveOrNull(prop.value) ? prop.value : renderObject(prop.value, true)}</span>
</div>`;
}

function renderIteratorValues(obj, i) {
  return `<div class="iterator-value">
  Value: ${i}  <span class="instance-of">${obj.instanceOf}</span> 
  <span class="value">${isPrimitiveOrNull(obj) ? obj : renderObject(obj, true)}</span>
  
</div>`;

}
function renderObject(obj, hideType) {
  return `<div class="object">
  ${!hideType ? `<div class="instance-of">${obj.instanceOf}</div>` : ''}
  ${obj.iterableValues ? `<div class="iterable-values">${obj.iterableValues.map(renderIteratorValues).join('')}</div>` : ''}
  <div class="properties">${obj.properties.map(renderProperty).join('')}</div>
</div>`;  
}

function renderHTML(obj) {
  return `<html><head><link type="text/css" rel="stylesheet" href="object-describe.css"/></head>
<body><div>${renderObject(obj)}</div></body></html>`
}


const obj = { a: 'A', b: [1, 2, {'three': {'iii': [3]}}], c: null, d: Date.now(), e: undefined, f: new Date() };

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

const seq = Sequence.from([1,2,3, [Sequence.from([1,2,3]), 'a']]);

const descrip = describe(seq, true);
xdmp.save(
  '/Users/jmakeig/Workspaces/object-describe/rendered.html',
  xdmp.unquote(
    renderHTML(descrip)
  )
);
descrip;


