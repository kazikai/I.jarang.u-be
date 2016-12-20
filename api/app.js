

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


// 조회 api
app.get( "/api/search/shop", function( req, res ) {
    var word = req.query.query;
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
        qs: {
            query: word,
            sort: sort,
            display: 1,
            start: 1
        }
    };
    var responseDataItem = [];
    var totalCount = 0;
    console.log( options );
    request( options, function (error, response, body) {
        var responseData = {};
        var iterationCount = 0;
        var i, max;
        if ( error ) {
            return console.error('fail', error);
        }
        responseData = JSON.parse( response.body );
        totalCount = +responseData.total;
        max = Math.ceil( totalCount/100 );
        console.log( totalCount );
        // 2540 , 26번 요청 되어야함
        // 45 , 5번
        options.qs.display = 100;
        iterationCount = max;
        for( i = 1;  i <= max; i += 1 ) {
            if ( i !== 1 ) {
                options.qs.start =  ( i - 1 ) * 100;
            }
            request( options, function( err, response, body ) {
                var responseData = {};
                if ( error ) {
                    return console.error('fail', error);
                }
                iterationCount--;
                responseData = JSON.parse( response.body );
                responseDataItem = responseDataItem.concat( responseData.items );
                if ( iterationCount === 0) {
                    console.log( "success" );
                    responseData.items = responseDataItem;
                    res.send( responseData );
                }
            } );

        }
    });
} );

app.get('/', function (req, res) {
  res.send('Hello World!')
});
console.log('Example app listening on port 3000!')
app.listen( 3000 );
