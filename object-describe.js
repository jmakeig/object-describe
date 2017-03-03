'use strict';

const obj = { a: 'A', b: [1, 2, 3], c: null, d: Date.now(), e: undefined };

function describe(obj) {
  const props = [];
  do {
    const propsAndSymbols = [].concat(
      Object.getOwnPropertyNames(obj),
      Object.getOwnPropertySymbols(obj)
    );
    for (const prop of propsAndSymbols) {
      const p = { name: prop };
      switch (typeof obj[prop]) {
        case 'string':
        case 'number':
        case 'date':
        case 'boolean':
        case 'function':
          p.value = String(obj[prop]);
          break;
        case 'object':
        case 'symbol':
          if (null === obj[prop] || undefined === obj[prop]) {
            p.value = String(obj[prop]);
          } else {
            p.value = describe(obj[prop]);
          }
          break;
      }

      p.type = typeof obj[prop];
      p.typeOf
      props.push(p);
    }
  } while (obj = Object.getPrototypeOf(obj));
  return props;
}

describe(obj);

