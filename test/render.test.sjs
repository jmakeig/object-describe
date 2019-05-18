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
import describe from '../src/describe.js';
import { renderHTML } from '../src/render.js';

/**
 * XPath helper
 *
 * @param {Node} node
 * @param {string} path
 * @returns {Array<Node>}
 */
function xpath(node, path) {
  if (node instanceof Node) {
    return Array.from(node.xpath(path));
  }
  throw new Error('Global XPath is not implemented yet.');
}

test('html', assert => {
  const obj = { a: 'A' };
  const html = renderHTML(describe(obj));
  const node = fn.head(xdmp.unquote(html));
  assert.true(undefined !== node);
  assert.true(xpath(node, '//div').length > 0);
  // assert.equal(
  //   xpath(
  //     node,
  //     '(//div[@class eq "object"])[1]/span[@class eq "is" and @class="is-Object"]'
  //   ).length,
  //   1
  // );
  assert.end();
});
