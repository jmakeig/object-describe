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
const { deepEqualSets } = require('./test-util.js');

test('primitive set eqaulity', assert => {
  const setA = new Set(['a', 'b', 'c']);
  const setA1 = new Set(['a', 'b', 'c']);
  const setAplus = new Set(['a', 'b', 'c', 'd']);
  const setAshuffle = new Set(['c', 'a', 'b']);
  const setX = new Set(['a', 'b', 'X']);

  assert.true(deepEqualSets(setA, setA));
  assert.true(deepEqualSets(setA, setA1));
  assert.false(deepEqualSets(setA, setX));
  assert.false(deepEqualSets(setA, setAplus));
  assert.true(deepEqualSets(setA, setAshuffle));

  assert.false(deepEqualSets(setA, null));
  assert.false(deepEqualSets(setA, undefined));
  assert.false(deepEqualSets(setA, ['a', 'b', 'c']));
  assert.end();
});

test('set deep-equal', assert => {
  const setA = new Set([{ a: 'A' }, { b: 'B' }]);
  const setA1 = new Set([{ a: 'A' }, { b: 'B' }]);
  const setAplus = new Set([{ a: 'A' }, { b: 'B' }, { b: 'B' }]);
  const setAplus1 = new Set([{ c: 'C' }, { a: 'A' }, { b: 'B' }]);
  const setAshuffle = new Set([{ b: 'B' }, { a: 'A' }]);
  const setX = new Set([{ a: 'A' }, { x: 'B' }]);
  assert.true(deepEqualSets(setA, setA1));
  assert.true(deepEqualSets(setA, setAshuffle));
  assert.false(deepEqualSets(setA, setX));
  assert.false(deepEqualSets(setA, setAplus));
  assert.false(deepEqualSets(setA, setAplus1));
  assert.end();
});
