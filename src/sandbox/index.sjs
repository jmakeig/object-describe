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

const { describe } = require('./describe');
const { renderHTML, escapeHTML } = require('./render.js');

const input = `function Animal() {}
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

({
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
  node: fn.head(xdmp.unquote('<asdf attr="asdf">asdf</asdf>')),
});`;
const obj = eval(input);

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
      const html = htmlDoc(input, descrip, renderHTML(descrip));
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

function htmlDoc(input, description, html) {
  return `<!DOCTYPE html>
<html>
  <head>
    <title>Object Properties and Prototypes—HTML</title>
    <link type="text/css" rel="stylesheet" href="object-describe.css" />
    <style type="text/css">
      body {
        padding: 1em;
        font-family: Helvetica;
        color: #333;
        font-size: 12pt;
      }
      h2 { margin: 1.5em 0; }
    </style>
  </head>
  <body>
    <div class="toggleable">
      <h2 style="display: inline;">Describe</h2>
      <div class="toggle-group" style="border: none;">
        <div id="describe-object">${html}</div>
      </div>
    </div>
    <script type="text/javascript" src="ui.js">//</script>
    <div class="toggleable toggle-none">
      <h2 style="display: inline;">Input</h2>
      <div class="toggle-group">
        <pre style="width: 100%; font-family: 'SF Mono', Consolas, monospace; color: #333; line-height: 1.45;font-size: 85%;">${escapeHTML(input)}</pre>
      </div>
    </div>
    <div class="toggleable toggle-none">
      <h2 style="display: inline;">Raw Report</h2>
      <div class="toggle-group">
        <pre style="width: 100%; font-family: 'SF Mono', Consolas, monospace; color: #333; line-height: 1.45;font-size: 85%;">${escapeHTML(JSON.stringify(description, null, 2))}</pre>
      </div>
    </div>
  </body>
</html>`;
}
