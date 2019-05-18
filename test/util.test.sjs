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
import { test } from './test.js';

import {
  instanceType,
  isPrimitiveOrNull,
  isNullOrUndefined,
  isArrayLike,
  isIterable,
  getPropertyValue,
  RESTRICTED_FUNCTION_PROPERTY,
  parseFunctionSignature,
  serialize,
  groupByBuckets
} from '../src/util.js';

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
});

test('isNullOrUndefined', assert => {
  assert.true(isNullOrUndefined(null));
  assert.true(isNullOrUndefined(undefined));
  assert.true(isNullOrUndefined());
  assert.false(isNullOrUndefined({}));
  assert.false(isNullOrUndefined('string'));
});

test('isArrayLike', assert => {
  assert.true(isArrayLike([]));
  assert.true(isArrayLike([1]));
  assert.true(isArrayLike({ length: 1 }));
  assert.false(isArrayLike(null));
  assert.false(isArrayLike({}));
  assert.false(isArrayLike({ length: -1 }));
});

test('isIterable', assert => {
  assert.true(isIterable([]));

  const custom = {
    *[Symbol.iterator]() {
      yield 1;
    }
  };
  assert.true(isIterable(custom));

  assert.false(isIterable(''));
  assert.true(isIterable('', true));
});

test('instanceType', assert => {
  assert.equal(instanceType(null), 'null');
  assert.equal(instanceType('string'), 'string');
  assert.equal(instanceType(1e3), 'number');
  assert.equal(instanceType(NaN), 'number');
  assert.equal(instanceType(true), 'boolean');
  assert.equal(instanceType(), 'undefined');
  assert.equal(instanceType(() => true), 'Function');
  assert.equal(instanceType(function() {}), 'Function');
  // Object.prototype.toString.call(function*(){}) => GeneratorFunction. Should we do more here?
  assert.equal(instanceType(function*() {}), 'GeneratorFunction');
  assert.equal(instanceType((function*() {})()), 'Generator');
  assert.equal(instanceType(Symbol.for('symbol')), 'symbol');

  assert.equal(instanceType({}), 'Object');
  assert.equal(instanceType(new Date()), 'Date');
  assert.equal(instanceType(Object.create(null)), 'Object');
  assert.equal(instanceType(Object.create(Map.prototype)), 'Map');

  class Foo {}
  assert.equal(instanceType(new Foo()), 'Foo');
  assert.equal(instanceType(Object.create(Foo.prototype)), 'Foo');

  function Bar() {}
  Bar.prototype = Object.create(Foo.prototype);
  Bar.prototype.constructor = Bar;
  assert.equal(instanceType(new Bar()), 'Bar');
  assert.equal(instanceType(Object.create(Bar.prototype)), 'Bar');

  /* <https://gist.github.com/jmakeig/52337c191b8f4e176e56d796129cad25> */
  function Baz() {}
  Baz.prototype = Object.create(Foo.prototype);
  assert.equal(instanceType(new Baz()), 'Foo');
  assert.equal(instanceType(Object.create(Baz.prototype)), 'Foo');
});

test('serialize', assert => {
  assert.equal(serialize(null), 'null');
  assert.equal(serialize(undefined), 'undefined');
  assert.equal(serialize(100), '100');
  assert.equal(serialize(Number.NaN), 'NaN');
  assert.equal(serialize(true), 'true');
  assert.equal(serialize('asdf'), '"asdf"');
});

test('parseFunctionSignature', assert => {
  assert.equal(parseFunctionSignature(undefined), void 0, 'Undefined function');
  function f1() {
    return 0;
  }
  assert.deepEqual(parseFunctionSignature(f1), {
    isGenerator: false,
    name: 'f1',
    parameters: [],
    body: '    return 0;',
    isNative: false
  }, 'Simple function');

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
      body: '    a = bbbbb++ - c;\n    return 0;',
      isNative: false
    },
    'with parameters'
  );
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
      body:
        '    `Here is a really long string that includes ${a} and a bunch of other stuff`;\n    return 0;',
      isNative: false
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
      isNative: false
    },
    'generator'
  );

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
      isNative: false
    },
    'anonymous generator'
  );

  const f6 = (things, stuff) => things || stuff;
  assert.deepEqual(
    parseFunctionSignature(f6),
    {
      parameters: ['things', 'stuff'],
      body: 'things || stuff',
      isLambda: true
    },
    'lambda'
  );

  const f7 = (things, stuff) => {
    const x = '';
    x || things || stuff;
  };
  assert.deepEqual(
    parseFunctionSignature(f7),
    {
      parameters: ['things', 'stuff'],
      body: "    const x = '';\n    x || things || stuff;",
      isLambda: true
    },
    'lambda'
  );
  const f7a = things => things;
  assert.deepEqual(
    parseFunctionSignature(f7a),
    {
      parameters: ['things'],
      body: 'things',
      isLambda: true
    },
    'lambda, no parens'
  );

  const f8 = Array.prototype[Symbol.iterator];
  assert.deepEqual(
    parseFunctionSignature(f8),
    {
      isGenerator: false, // duck-typed
      name: 'values',
      parameters: [],
      body: '[native code]',
      isNative: true
    },
    'isNative'
  );

  const itarable = {
    *[Symbol.iterator]() {
      yield 1;
    }
  };
  assert.deepEqual(parseFunctionSignature(itarable[Symbol.iterator]), {
    name: '[Symbol.iterator]',
    isGenerator: true,
    body: '      yield 1;',
    isNative: false,
    parameters: []
  });

  function Snake() {}
  Snake.prototype.constructor = Snake;
  Snake.prototype.toString = function toString() { return `I’m a snake with ${this.legs} legs`;}
  // '() => `I’m a snake with ${this.legs} legs`'
  assert.equal(
    parseFunctionSignature(Snake.prototype.toString).parameters.length,
    0
  );
  assert.equal(
    parseFunctionSignature(Snake.prototype.toString).body,
    'return `I’m a snake with ${this.legs} legs`;'
  );
});

test('getPropertyValue', assert => {
  const a = { a: 'A' };
  assert.equal(getPropertyValue(a, 'a'), 'A');
  // assert.throws(() => {
  //   getPropertyValue(null, 'a');
  // }, TypeError, 'Gettting a property on a null');
  assert.throws(() => {
    getPropertyValue(a);
  }, ReferenceError);
  assert.equal(typeof getPropertyValue('', 'toString'), 'function');
  const f = () => undefined;
  assert.equal(getPropertyValue(f, 'caller'), RESTRICTED_FUNCTION_PROPERTY);
  assert.equal(getPropertyValue(f, 'arguments'), RESTRICTED_FUNCTION_PROPERTY);
});

test('groupByBuckets', assert => {
  const arr = new Array(55).fill('0').map((item, index) => index);
  const buckets = groupByBuckets(arr, 25, 100);
  assert.equal(buckets.length, 3);
  assert.equal(buckets[2].items.length, 5);

  const buckets2 = groupByBuckets(arr, 25, 10);
  assert.equal(buckets2.length, 1);
  assert.equal(buckets2[0].items.length, 10);

  const buckets3 = groupByBuckets(arr, 4.99, 100);
  assert.equal(buckets3.length, 14);
  assert.equal(buckets3[13].items.length, 3);

  const buckets4 = groupByBuckets(arr, 4);
  assert.equal(buckets4.length, 13);
  assert.equal(buckets4[12].items.length, 2);

  assert.throws(() => groupByBuckets(), TypeError);
  assert.throws(() => groupByBuckets([], -22), TypeError);
});
