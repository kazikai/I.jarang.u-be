

var privateData = require( './options.js' ).getPrivateData();
var CLIENTID = privateData.CLIENTID;
var CLIENTSECRET = privateData.CLIENTSECRET;

var express = require('express');
var cors = require('cors');
var bodyParser = require( "body-parser" );
var requestify = require('requestify');

var mongoose = require('mongoose');

var app = express();

var winston = require('winston');
var moment = require('moment');
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');
winston.level = 'silly';

var timestamp = function(){
    return moment().format('hh:mm:ss.SSS');
};
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.DailyRotateFile)({
            name: 'info-file',
            filename: 'log/app',
            level: 'info',
            json: false,
            timestamp:timestamp,
            handleExceptions: true,
            datePattern: '.yyyy-MM-dd.log'
        })
    ],
    exceptionHandlers: [
        new winston.transports.DailyRotateFile({
            name: 'error-file',
            filename: 'log/error',
            json: true,
            handleExceptions: true,
            timestamp:timestamp,
            datePattern: '.yyyy-MM-dd.log'
        })
    ]
});


var multer = require('multer'); // v1.0.5
var upload = multer(); // for parsing multipart/form-data

var request = require('request');
// db Name;

logger.info( 'API Server Start!!!' );
mongoose.connect( 'mongodb://localhost:27100' );
db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
    logger.info( 'DataBase initialize success' );
})
// cors setting
app.use(cors());
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get( "/api/search/shop", function( req, res ) {
    var word = req.query.word;
    var sort = req.query.sort;
    var display = req.query.display;
    //X-Naver-Client-Secret    //"X-Naver-Client-Id"

    var options = {
        url: 'https://openapi.naver.com/v1/search/shop.json',
        method: "GET",
        headers: {
            'X-Naver-Client-Id': CLIENTID,
            'X-Naver-Client-Secret': CLIENTSECRET
        },
        formData: {
            query: word,
            sort: sort,
            display: display
        }
    };
    request( options, function (error, response, body) {
        if ( error ) {
            return console.error('fail', error);
        }
        res.send( body );
    });
} );

app.get('/', function (req, res) {
  res.send('Hello World!')
});
console.log('Example app listening on port 3000!')
app.listen( 3000 );
