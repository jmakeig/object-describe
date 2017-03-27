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
const { renderHTML } = require('../src/render.js');

test('', assert => {
  const obj = { a: 'A' };
  const html = renderHTML(describe(obj));
  const node = fn.head(xdmp.unquote(html));
  assert.true(undefined !== node);
  assert.equal(Array.from(node.xpath('//div')).length, 19);

  assert.end();
});