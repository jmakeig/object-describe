function Input(
  js = '',
  environment = 'marklogic',
  onRun = heirarchy => console.dir(heirarchy),
  onError = error => console.dir(error),
  onChange = value => console.dir(value)
) {
  function doEvalBrowser(js) {
    console.info('Evaluating locally in the browser');
    try {
      const json = describe(eval(js));
      return Promise.resolve(Promise.resolve(json));
    } catch (err) {
      return Promise.reject(Promise.resolve({ body: { errorResponse: err } }));
    }
  }
  function doEvalMarkLogic(js) {
    console.info('Evaluating in MarkLogic');
    return fetch('/eval', {
      method: 'POST',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/javascript' },
      body: js
    }).then(res => {
      if (res.ok) {
        return res.json();
      }
      throw res.json(); // Throws a Promise
    });
  }

  /**
   * FIXME: This is ugly. Figure out how to refactor to account for the different
   * types of possible errors:
   *
   *   1. Network errors: connection, auth, timeout
   *   2. Server errors
   *      - User (400)
   *      - System (500)
   *   3. Response parsing (async)
   *   4. Render
   *   5. Unhandled exeception (bug)
   *
   * - Normalize errors across 1 and 2
   * - Provide error codes and resolution
   *
   * @param {*} error
   */
  function parseError(error) {
    if ('JS-JAVASCRIPT' === error.messageCode) {
      const messageMatcher = /JS-JAVASCRIPT: (.+) -- Error running JavaScript request: (.+)/;
      const matches = messageMatcher.exec(error.message);
      if (3 == matches.length) {
        return {
          input: matches[1],
          error: matches[2],
          toString() {
            return `${this.input} — ${this.error}`;
          }
        };
      }
    } else if ('ECONNREFUSED' === error.code) {
      console.warn(error);
      return {
        toString() {
          return 'Connection to MarkLogic was refused. Check that MarkLogic is runnning and the host and credentials that you used to start this application are correct.';
        }
      };
    }
    return error.message || error.toString();
  }

  const inputEl = document.querySelector('#input');
  const environmentEl = document.querySelector('form').run;
  const runEl = document.querySelector('#doEval');

  // Set initial state
  inputEl.value = js;
  environmentEl.value = environment;

  function runInternal(quiet = false) {
    console.time('eval');

    const doEval =
      'marklogic' === environmentEl.value ? doEvalMarkLogic : doEvalBrowser;

    doEval(inputEl.value)
      .then(hierarchy => {
        onRun(hierarchy, inputEl.value, quiet);
      })
      .catch(err => {
        // Render error
        if (err instanceof Error) throw err;
        err
          .then(e => {
            // Server-side error
            if (e && e.body) {
              onError(parseError(e.body.errorResponse).toString());
            }
            // Middle-tier error (?)
            else {
              onError(parseError(e).toString());
            }
          })
          .catch(parseError(onError));
      })
      // Render error
      .catch(onError)
      .finally(() => {
        console.timeEnd('eval');
      });
  }

  // Event listeners
  runEl.addEventListener('click', evt => {
    evt.preventDefault();
    runInternal();
  });

  // TODO: Componentize
  inputEl.addEventListener('keydown', function(evt) {
    if (evt.ctrlKey && evt.key === 'Enter') {
      runEl.click();
      evt.preventDefault();
    }
  });

  return {
    get js() {
      return input.value;
    },
    set js(text) {
      inputEl.value = text;
      onChange(inputEl.value);
    },
    get environment() {
      return environment.value;
    },
    set environment(env) {
      environmentEl.value = env;
    },
    /**
     * Evaluate the JavaScript input and render the type hierarchy visualization
     *
     * @param {boolean} [quiet = false] Whether to suppress side effects
     */
    run(quiet = false) {
      runInternal(quiet);
    }
  };
}
