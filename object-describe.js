'use strict';

const obj = {
  a: 'A',
  b: [1, 2, { three: { iii: [3] } }],
  c: null,
  d: Date.now(),
  e: undefined,
  f: new Date()
};

function Foo() {}
Foo.prototype.fff = function() {};
Foo.prototype[Symbol.toStringTag] = 'Foo';
const foo = new Foo();

const dict = Object.create(null);
dict['a'] = 'A';
dict.constructor === undefined; // true

class Bar extends Foo {
  bbb() {
  }
  fff() {
  }
}
const bar = new Bar();
bar.obj = obj;

const baz = Object.create(Bar.prototype);

//const seq = Sequence.from([1, 2, 3, [Sequence.from([1, 2, 3]), 'a']]);

const describe = require('src/describe.js').describe;
const renderHTML = require('src/render.js').renderHTML;

const descrip = describe(bar);

xdmp.save(
  '/Users/jmakeig/Workspaces/object-describe/rendered.html',
  xdmp.unquote(renderHTML(descrip))
);
// console.log(descrip);
descrip;
