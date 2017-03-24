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
  assert.equal(report.instanceOf, 'null');
  assert.deepEqual(report.properties, []);
  assert.equal(report.value, 'null');
  assert.end();
});

test('undefined', assert => {
  const report = describe(undefined);
  assert.equal(report.instanceOf, 'undefined');
  assert.deepEqual(report.properties, []);
  assert.equal(report.value, 'undefined');
  assert.end();
});

test('boolean', assert => {
  const report = describe(true);
  assert.equal(report.instanceOf, 'boolean');
  assert.deepEqual(report.properties, []);
  assert.equal(report.value, 'true');
  assert.end();
});

test('boolean', assert => {
  const report = describe(true);
  assert.equal(report.instanceOf, 'boolean');
  assert.deepEqual(report.properties, []);
  assert.equal(report.value, 'true');
  assert.equal(
    report.prototype.instanceOf,
    'Boolean',
    'Boolean is prototype of boolean'
  );
  assert.true(
    report.prototype.properties.length > 1,
    'Boolean prototype has properties'
  );
  assert.end();
});

test('number', assert => {
  const report = describe(123456);
  assert.equal(report.instanceOf, 'number');
  assert.deepEqual(report.properties, []);
  assert.equal(report.value, (123456).toLocaleString());

  assert.end();
});

test('simple object', assert => {
  const obj = { a: 'A' };
  const descrip = describe(obj);

  assert.equal(descrip.instanceOf, 'Object');
  assert.equal(descrip.properties.length, 1);
  const a = descrip.properties[0];

  assert.equal(a.name, 'a');
  assert.equal(a.value, '"A"');
  assert.equal(a.instanceOf, 'string');
  assert.true(a.enumerable);
  assert.true(a.configurable);
  assert.equal(a.from, 'Object'); // I don’t think this is correct

  assert.equal(descrip.prototype.instanceOf, 'Object');
  assert.true(descrip.prototype.properties.length > 1);
  assert.end();
});

test('array of primitives', assert => {
  const obj = ['A', 'B', 'C'];
  const descrip = describe(obj);

  assert.equal(descrip.instanceOf, 'Array');
  assert.equal(descrip.properties.length, 4); // 3 values + length
  assert.equal(descrip.prototype.instanceOf, 'Array');
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
  assert.equal(descrip.prototype.prototype.instanceOf, 'Object');
  assert.end();
});
