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

const descrip = describe(['A', 'B', 'C'], [Object, Function, Array]);

// xdmp.save(
//   '/Users/jmakeig/Workspaces/object-describe/rendered.html',
//   xdmp.unquote(renderHTML(descrip))
// );

/* global xdmp cts */
const format = xdmp.getRequestField('format');
switch (format) {
  case 'html':
    xdmp.setResponseContentType('text/html');
    renderHTML(descrip);
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
