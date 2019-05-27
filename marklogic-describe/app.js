const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');

const marklogic = require('marklogic');
const evalRouter = require('./routes/eval');

function createApp(host, user, password) {
  const app = express();

  app.use(logger('dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(
    '/eval',
    bodyParser.text({ type: 'application/javascript' }),
    evalRouter
  );

  const db = marklogic.createDatabaseClient({
    host,
    port: '8000',
    database: 'Documents',
    user,
    password,
    authType: 'DIGEST'
  });

  app.locals.db = db;
  return app;
}

module.exports = createApp;
