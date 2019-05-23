const express = require('express');
const router = express.Router();

const fs = require('fs');

const marklogic = require('marklogic');

// FIXME: This is a total hack
const db = marklogic.createDatabaseClient({
  host: 'localhost',
  port: '8000',
  database: 'Documents',
  user: 'admin',
  password: '********',
  authType: 'DIGEST'
});

// FIXME: This is a total hack
const describe = (function _memo() {
  const d = fs.readFileSync('public/javascripts/describe.js', 'utf8');
  // Note: We’re already doing eval, so this doesn’t introduce any new
  //       security issues
  return (js = '') => `${d}\ndescribe(eval("${js.replace(/"/g, '\\"')}"));`;
})();

router.post('/', function(req, res, next) {
  console.log(req.body);
  // res.send(describe(`const asdf={asdf:"asdf"}; asdf;`));
  db.eval(describe(req.body))
    .result()
    .then(response => res.json(response[0].value));
});

module.exports = router;
