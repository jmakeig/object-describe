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
const test = require('/mltap/test');
const { describe } = require('../src/describe.js');

test('null', assert => {
  const report = describe(null);
  assert.equal(report.is, 'null');
  assert.equal(report.properties, undefined);
  assert.equal(report.value, 'null');
  assert.end();
});

test('undefined', assert => {
  const report = describe(undefined);
  assert.equal(report.is, 'undefined');
  assert.equal(report.properties, undefined);
  assert.equal(report.value, 'undefined');
  assert.end();
});

test('boolean', assert => {
  const report = describe(true);
  assert.equal(report.is, 'boolean');
  assert.equal(report.value, 'true');
  assert.equal(report.properties, undefined);
  assert.equal(report.prototype, undefined);
  assert.end();
});

test('number', assert => {
  const report = describe(123456);
  assert.equal(report.is, 'number');
  assert.deepEqual(report.properties, undefined);
  assert.equal(report.value, (123456).toLocaleString());

  assert.end();
});

test('function, anonymous', assert => {
  // eslint-disable-next-line prefer-arrow-callback
  const descrip = describe(function() {});
  assert.equal(descrip.is, 'Function');
  assert.deepEqual(descrip.value, {
    isGenerator: false,
    name: '',
    parameters: [],
    body: '',
    isNative: false,
  });
  assert.end();
});

test('function, named', assert => {
  // eslint-disable-next-line prefer-arrow-callback
  const descrip = describe(function asdf() {});
  assert.equal(descrip.is, 'Function');
  assert.deepEqual(descrip.value, {
    isGenerator: false,
    name: 'asdf',
    parameters: [],
    body: '',
    isNative: false,
  });
  assert.end();
});

test('function, named, params', assert => {
  // eslint-disable-next-line prefer-arrow-callback
  const descrip = describe(function asdf(a, b = 55) {
    return a + b;
  });
  assert.equal(descrip.is, 'Function');
  assert.deepEqual(descrip.value, {
    isGenerator: false,
    name: 'asdf',
    parameters: ['a', 'b = 55'],
    body: '    return a + b;',
    isNative: false,
  });
  assert.end();
});

test('simple object', assert => {
  const obj = { a: 'A' };
  const descrip = describe(obj);

  assert.equal(descrip.is, 'Object');
  assert.equal(descrip.properties.length, 1);
  const a = descrip.properties[0];

  assert.equal(a.name, 'a');
  assert.equal(a.value, '"A"');
  assert.equal(a.is, 'string');
  assert.true(a.enumerable);
  assert.true(a.configurable);
  assert.equal(a.from, 'Object');

  assert.equal(descrip.prototype.is, 'Object');
  assert.true(descrip.prototype.properties.length > 1);
  assert.end();
});

test('array of primitives', assert => {
  const obj = ['A', 'B', 'C'];
  const descrip = describe(obj);

  assert.equal(descrip.is, 'Array');
  assert.equal(descrip.properties.length, 4); // 3 values + length
  assert.equal(descrip.prototype.is, 'Array');
  const props = [
    'Symbol(Symbol.iterator)',
    'Symbol(Symbol.unscopables)',
    'concat',
    'constructor',
    'copyWithin',
    'entries',
    'every',
    'fill',
    'filter',
    'find',
    'findIndex',
    'forEach',
    'includes',
    'indexOf',
    'join',
    'keys',
    'lastIndexOf',
    'length',
    'map',
    'pop',
    'push',
    'reduce',
    'reduceRight',
    'reverse',
    'shift',
    'slice',
    'some',
    'sort',
    'splice',
    'toLocaleString',
    'toString',
    'unshift',
  ];
  assert.deepEqual(
    descrip.prototype.properties.map(item => item.name).sort(),
    props
  );
  assert.equal(descrip.prototype.prototype.is, 'Object');
  assert.end();
});

test('getters and setters', assert => {
  const obj = {};
  Object.defineProperty(obj, 'a', {
    get() {
      return 'A';
    },
    set(value) {}, // eslint-disable-line no-unused-vars
  });

  const descrip = describe(obj);
  assert.equal(descrip.properties.length, 1);
  const a = descrip.properties[0];
  assert.equal(a.name, 'a');
  assert.equal(a.value, '"A"');
  assert.equal(a.getter.name, 'get');
  assert.equal(a.getter.parameters.length, 0);
  assert.equal(a.setter.name, 'set');
  assert.deepEqual(a.setter.parameters, ['value']);
  assert.end();
});

test('overridden and inherited properties', assert => {
  function Animal() {}
  Animal.prototype.speak = function() {
    return 'hmm';
  };
  Animal.prototype.run = function() {
    return 'run';
  };
  Object.defineProperty(Animal.prototype, 'legs', {
    get() {
      return 4;
    },
  });

  function Dog() {}
  Dog.prototype = Object.create(Animal.prototype);
  Dog.prototype.constructor = Dog;
  Dog.prototype.speak = function speak() {
    return 'bark';
  };
  Dog.prototype.fetch = function fetch() {
    Error.captureStackTrace(this);
    return top(this.stack);
  };
  const dog = new Dog();

  const descrip = describe(dog);

  const pred = name => prop => name === prop.name;

  assert.deepEqual(
    descrip.prototype.properties.filter(pred('constructor'))[0].from,
    'Dog'
  );
  assert.deepEqual(
    descrip.prototype.prototype.properties.filter(pred('constructor'))[0].from,
    'Animal'
  );
  assert.deepEqual(
    descrip.prototype.prototype.prototype.properties.filter(
      pred('constructor')
    )[0].from,
    'Object'
  );

  assert.deepEqual(
    descrip.prototype.properties.filter(pred('speak'))[0].from,
    'Dog'
  );
  assert.deepEqual(
    descrip.prototype.properties.filter(pred('fetch'))[0].from,
    'Dog'
  );
  const legs = descrip.prototype.prototype.properties.filter(pred('legs'))[0];
  assert.deepEqual(legs.from, 'Animal');
  assert.equal(legs.getter.name, 'get');

  assert.end();
});

test('circular', assert => {
  const a = { b: {} };
  const b = { a: a };
  a.b = b;

  const descrip = describe(a);
  assert.true(
    descrip.properties[0].value.properties[0].value.properties[0].isCircular
  );

  assert.end();
});

test('iterable', assert => {
  assert.equal(describe([1, 2, 3]).prototype.isIterable, true);
  assert.equal(
    describe(
      (function*() {
        yield 1;
      })()
    ).prototype.prototype.prototype.isIterable,
    true
  );
  assert.end();
});
