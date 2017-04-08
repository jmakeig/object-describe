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
const {
  instanceType,
  isPrimitiveOrNull,
  isNullOrUndefined,
  isArrayLike,
  isIterable,
  getPropertyValue,
  RESTRICTED_FUNCTION_PROPERTY,
  parseFunctionSignature,
  serialize,
} = require('../src/util.js');

test('isPrimitiveOrNull', assert => {
  assert.true(isPrimitiveOrNull(undefined));
  assert.true(isPrimitiveOrNull(null));
  assert.true(isPrimitiveOrNull(1111e3));
  assert.true(isPrimitiveOrNull('string'));
  assert.true(isPrimitiveOrNull(false));
  assert.true(isPrimitiveOrNull(Symbol.for('symbol')));
  assert.true(isPrimitiveOrNull(new Date()));
  assert.false(isPrimitiveOrNull({}));
  assert.false(isPrimitiveOrNull([]));
  assert.end();
});

test('isNullOrUndefined', assert => {
  assert.true(isNullOrUndefined(null));
  assert.true(isNullOrUndefined(undefined));
  assert.true(isNullOrUndefined());
  assert.false(isNullOrUndefined({}));
  assert.false(isNullOrUndefined('string'));
  assert.end();
});

test('isArrayLike', assert => {
  assert.true(isArrayLike([]));
  assert.true(isArrayLike([1]));
  assert.true(isArrayLike({ length: 1 }));
  assert.false(isArrayLike(null));
  assert.false(isArrayLike({}));
  assert.false(isArrayLike({ length: -1 }));
  assert.end();
});

test('isIterable', assert => {
  assert.true(isIterable([]));

  const custom = {
    *[Symbol.iterator]() {
      yield 1;
    },
  };
  assert.true(isIterable(custom));

  assert.false(isIterable(''));
  assert.true(isIterable('', true));
  assert.end();
});

test('instanceType', assert => {
  assert.equal(instanceType(null), 'null');
  assert.equal(instanceType('string'), 'string');
  assert.equal(instanceType(1e3), 'number');
  assert.equal(instanceType(NaN), 'number');
  assert.equal(instanceType(true), 'boolean');
  assert.equal(instanceType(), 'undefined');
  assert.equal(instanceType(() => true), 'Function');
  // eslint-disable-next-line no-empty-function
  assert.equal(instanceType(function() {}), 'Function'); // eslint-disable-line prefer-arrow-callback
  // Object.prototype.toString.call(function*(){}) => GeneratorFunction. Should we do more here?
  assert.equal(instanceType(function*() {}), 'GeneratorFunction'); // eslint-disable-line no-empty-function
  assert.equal(instanceType((function*() {})()), 'Generator'); // eslint-disable-line no-empty-function
  assert.equal(instanceType(Symbol.for('symbol')), 'symbol');

  assert.equal(instanceType({}), 'Object');
  assert.equal(instanceType(new Date()), 'Date');
  assert.equal(instanceType(Object.create(null)), 'Object');
  assert.equal(instanceType(Object.create(Map.prototype)), 'Map');

  class Foo {}
  assert.equal(instanceType(new Foo()), 'Foo');
  assert.equal(instanceType(Object.create(Foo.prototype)), 'Foo');

  function Bar() {} // eslint-disable-line no-empty-function
  Bar.prototype = Object.create(Foo.prototype);
  Bar.prototype.constructor = Bar;
  assert.equal(instanceType(new Bar()), 'Bar');
  assert.equal(instanceType(Object.create(Bar.prototype)), 'Bar');

  /* <https://gist.github.com/jmakeig/52337c191b8f4e176e56d796129cad25> */
  function Baz() {} // eslint-disable-line no-empty-function
  Baz.prototype = Object.create(Foo.prototype);
  assert.equal(instanceType(new Baz()), 'Foo');
  assert.equal(instanceType(Object.create(Baz.prototype)), 'Foo');

  assert.end();
});

test('serialize', assert => {
  assert.equal(serialize(null), 'null');
  assert.equal(serialize(undefined), 'undefined');
  assert.equal(serialize(100), '100');
  assert.equal(serialize(Number.NaN), 'NaN');
  assert.equal(serialize(true), 'true');
  assert.equal(serialize('asdf'), '"asdf"');
  assert.end();
});

test('parseFunctionSignature', assert => {
  assert.equal(parseFunctionSignature(undefined), void 0);
  function f1() {
    return 0;
  }
  assert.deepEqual(parseFunctionSignature(f1), {
    isGenerator: false,
    name: 'f1',
    parameters: [],
    body: '    return 0;',
    isNative: false,
  });

  function f2(a, bbbbb, c = true) {
    a = bbbbb++ - c;
    return 0;
  }
  assert.deepEqual(
    parseFunctionSignature(f2),
    {
      isGenerator: false,
      name: 'f2',
      parameters: ['a', 'bbbbb', 'c = true'],
      body: '    a = bbbbb++ - c;',
      isNative: false,
    },
    'with parameters'
  );
  // eslint-disable-next-line func-style
  const f3 = function(a) {
    `Here is a really long string that includes ${a} and a bunch of other stuff`;
    return 0;
  };
  assert.deepEqual(
    parseFunctionSignature(f3),
    {
      isGenerator: false,
      name: '',
      parameters: ['a'],
      // eslint-disable-next-line no-template-curly-in-string
      body: '    `Here is a really long string that includes ${a} and a bunch of other stuff`;',
      isNative: false,
    },
    'anonymous'
  );
  function* f4() {
    yield 0;
  }
  assert.deepEqual(
    parseFunctionSignature(f4),
    {
      isGenerator: true,
      name: 'f4',
      parameters: [],
      body: '    yield 0;',
      isNative: false,
    },
    'generator'
  );

  // eslint-disable-next-line func-style
  const f5 = function*() {
    yield 0;
  };
  assert.deepEqual(
    parseFunctionSignature(f5),
    {
      isGenerator: true,
      name: '',
      parameters: [],
      body: '    yield 0;',
      isNative: false,
    },
    'anonymous generator'
  );
  /*
  // TODO: Implement lambda parsing
  const f6 = (things, stuff) => things || stuff;
  assert.deepEqual(
    parseFunctionSignature(f6),
    {
      isGenerator: true,
      name: '',
      parameters: ['things', 'stuff'],
      body: '    yield 0;',
      isNative: false,
    },
    'lambda'
  );
*/
  const f8 = Array.prototype[Symbol.iterator];
  assert.deepEqual(
    parseFunctionSignature(f8),
    {
      isGenerator: false, // duck-typed
      name: 'values',
      parameters: [],
      body: ' [native code]',
      isNative: true,
    },
    'lambda'
  );
  assert.end();
});

test('getPropertyValue', assert => {
  const a = { a: 'A' };
  assert.equal(getPropertyValue(a, 'a'), 'A');
  assert.throws(
    () => {
      getPropertyValue(null, 'a');
    },
    TypeError
  );
  assert.throws(
    () => {
      getPropertyValue(a);
    },
    ReferenceError
  );
  assert.equal(typeof getPropertyValue('', 'toString'), 'function');
  const f = () => undefined;
  assert.equal(getPropertyValue(f, 'caller'), RESTRICTED_FUNCTION_PROPERTY);
  assert.equal(getPropertyValue(f, 'arguments'), RESTRICTED_FUNCTION_PROPERTY);
  assert.end();
});
