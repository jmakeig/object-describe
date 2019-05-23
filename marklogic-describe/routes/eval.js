const express = require('express');
const router = express.Router();

const marklogic = require('marklogic');

const db = marklogic.createDatabaseClient({
  host: 'localhost',
  port: '8000',
  database: 'Documents',
  user: 'admin',
  password: '********',
  authType: 'DIGEST'
});

/* GET users listing. */
router.post('/', function(req, res, next) {
  console.log(
    db
      .eval('const asdf={asdf:"asdf"}; asdf;')
      .result(response => res.json(response[0].value))
  );
  //res.json(JSON.stringify({ asdf: 'asdf' }));
});

module.exports = router;
