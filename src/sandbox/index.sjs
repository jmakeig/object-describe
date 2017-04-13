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
/*
const obj = {
  a: 'A',
  b: [1, 2, { three: { iii: [3] } }],
  c: null,
  d: Date.now(),
  e: undefined,
  f: new Date(),
};

function Foo() {}
Foo.prototype.fff = function() {};
Foo.prototype[Symbol.toStringTag] = 'Foo';
const foo = new Foo();

class Bar extends Foo {
  bbb() {}
  fff() {}
}
const bar = new Bar();
bar.obj = obj;

const baz = Object.create(Bar.prototype);

const dict = Object.create(null);
dict['a'] = 'A';
dict.constructor === undefined; // true

const seq = Sequence.from([1, 2, 3, [Sequence.from([1, 2, 3]), 'a']]);
const seq2 = Sequence.from(['a', 'b', 'c']);
*/

const { describe } = require('./describe');
const { renderHTML } = require('./render.js');

function Animal() {}
Animal.prototype.speak = function(words = 'growl') {
  return words;
};
Animal.prototype.toString = function() {
  return 'Hey, I’m an Animal!';
};
function Dog() {}
Dog.prototype = new Animal();
Dog.prototype.constructor = Dog;
Dog.prototype.speak = function() {};

const obj = {
  str: 'string',
  nil: null,
  now: new Date(),
  num: 9945581,
  bool: false,
  custom: new Dog(),
  obj: { b: 'B' },
  arr: new Array(20).fill(0),
  fct: function(param = '') {
    const x = 'X' + param;
    return x;
  },
  und: undefined,
  lambda: p => p + p + p,
  get gettersetter() {
    return this._id;
  },
  set gettersetter(value) {
    this._it = value;
  },
  *[Symbol.iterator]() {
    for (let i = 0; i < 10000; i++) {
      yield Math.random();
    }
  },
};

// const obj = Sequence.from([1, 2, 3]);
try {
  const descrip = describe(obj);

  // xdmp.save(
  //   '/Users/jmakeig/Workspaces/object-describe/rendered.html',
  //   xdmp.unquote(renderHTML(descrip))
  // );

  /* global xdmp cts */
  const format = xdmp.getRequestField('format');

  switch (format) {
    case 'html':
      xdmp.setResponseContentType('text/html');
      xdmp.setResponseEncoding('utf-8');
      const html = renderHTML(descrip);
      xdmp.unquote(html);
      html;
      break;
    case 'text':
      xdmp.setResponseContentType('text/plain');
      throw new Error('text formatting is not implemented yet');
    case 'json':
      xdmp.setResponseContentType('text/json');
      JSON.stringify(descrip, null, 2);
      break;
    default:
      xdmp.setResponseContentType('text/json');
      descrip;
  }
} catch (error) {
  xdmp.setResponseContentType('text/plain');
  xdmp.setResponseCode(500, 'Some error');
  error.stack;
}
