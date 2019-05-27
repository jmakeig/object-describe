const express = require('express');
const router = express.Router();

const fs = require('fs');

// FIXME: This is a total hack
const describe = (function _memo() {
  const d = fs.readFileSync('public/js/describe.js', 'utf8');
  // Note: We’re already doing eval, so this doesn’t introduce any new
  //       security issues
  return (js = '') => `${d}\ndescribe(eval(\`${js.replace(/`/g, '\\`')}\`));`;
})();

router.post('/', function(req, res, next) {
  req.app.locals.db
    .eval(describe(req.body))
    .result()
    .then(response => res.json(response[0].value))
    .catch(err => res.status(400).send(JSON.stringify(err)));
});

module.exports = router;
