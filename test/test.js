import { test as zora } from 'zora';

const decorate = specFn => t =>
  specFn(
    Object.assign(
      t,
      {
        true(actual, description = 'true') {
          const assertResult = {
            pass: true === actual,
            actual: actual,
            expected: true,
            description,
            operator: 'true'
          };

          this.collect(assertResult); // COLLECT RESULT
          return assertResult;
        }
      },
      {
        false(actual, description = 'true') {
          const assertResult = {
            pass: true !== actual,
            actual: actual,
            expected: false,
            description,
            operator: 'false'
          };

          this.collect(assertResult); // COLLECT RESULT
          return assertResult;
        }
      }
    )
  );

export const test = (description, spec) => zora(description, decorate(spec));
