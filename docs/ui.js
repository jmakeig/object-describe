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
document.body.addEventListener('click', evt => {
  // console.log(evt.target.classList);
  if (evt.target && evt.target.matches('.toggleable')) {
    evt.target.classList.toggle('toggle-none');
  }
});

const doit = evt => {
  let obj;
  try {
    obj = eval(document.querySelector('.input').value);
    const html = describe.renderHTML(describe.describe(obj));
    document.querySelector('.output').innerHTML = html;
  } catch (err) {
    document.querySelector('.output').innerHTML =
      err.message + '\n' + err.stack;
  }
};

for (const item of document.querySelectorAll('.doit')) {
  item.addEventListener('click', doit);
}
