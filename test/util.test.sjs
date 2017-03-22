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
} = require('../src/util.js');

test('isPrimitiveOrNull', assert => {
  assert.true(isPrimitiveOrNull(null));
  assert.true(isPrimitiveOrNull(1111e3));
  assert.true(isPrimitiveOrNull('string'));
  assert.true(isPrimitiveOrNull(false));
  assert.true(isPrimitiveOrNull(Symbol.for('symbol')));
  assert.false(isPrimitiveOrNull({}));
  assert.false(isPrimitiveOrNull([]));
  assert.false(isPrimitiveOrNull(new Date()));
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
  assert.equal(instanceType(() => true), 'function');
  // eslint-disable-next-line no-empty-function
  assert.equal(instanceType(function() {}), 'function'); // eslint-disable-line prefer-arrow-callback
  // Object.prototype.toString.call(function*(){}) => GeneratorFunction. Should we do more here?
  assert.equal(instanceType(function*() {}), 'function'); // eslint-disable-line no-empty-function
  assert.equal(instanceType(Symbol.for('symbol')), 'symbol');

  assert.equal(instanceType({}), 'Object');
  assert.equal(instanceType(new Date()), 'Date');
  assert.equal(instanceType(Object.create(null)), 'Object');
  assert.equal(instanceType(Object.create(Map.prototype)), 'Map');

  class Foo {}
  assert.equal(instanceType(new Foo()), 'Foo');
  assert.equal(instanceType(Object.create(Foo.prototype)), 'Foo');

  function Bar() {} // eslint-disable-line no-empty-function
  Bar.prototype = Object.assign(Bar.prototype, Object.create(Foo.prototype));
  assert.equal(instanceType(new Bar()), 'Bar');
  assert.equal(instanceType(Object.create(Bar.prototype)), 'Bar');

  /* <https://gist.github.com/jmakeig/52337c191b8f4e176e56d796129cad25> */
  function Baz() {} // eslint-disable-line no-empty-function
  Baz.prototype = Object.create(Foo.prototype);
  assert.equal(instanceType(new Baz()), 'Foo');
  assert.equal(instanceType(Object.create(Baz.prototype)), 'Foo');

  assert.end();
});
