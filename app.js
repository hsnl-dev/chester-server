const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const YAML = require('yamljs');
const cors = require('cors');
const session = require('cookie-session');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const passwordResetRouter = require('./routes/passwordReset');
const commodityRouter = require('./routes/commodity');
const productRouter = require('./routes/product');
const traceRouter = require('./routes/trace');
const externalApiRouter = require('./routes/api');

const app = express();

app.set('trust proxy', 1);
app.use(
    session({
        secret: 'Hsnl-iot33564@',
        resave: false,
        saveUninitialized: true,
        cookie: {secure: true, maxAge: 86400000}
    })
);

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/password-reset', passwordResetRouter);
app.use('/commodity', commodityRouter);
app.use('/product', productRouter);
app.use('/trace', traceRouter);
app.use('/api', externalApiRouter);

module.exports = app;
