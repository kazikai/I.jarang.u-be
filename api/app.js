

var privateData = require( './options.js' ).getPrivateData();
var CLIENTID = privateData.CLIENTID;
var CLIENTSECRET = privateData.CLIENTSECRET;

var express = require('express');
var cors = require('cors');
var bodyParser = require( "body-parser" );
var requestify = require('requestify');
var mongoose = require('mongoose');

var app = express();
var exec = require('child_process').exec;
var winston = require('winston');
var moment = require('moment');
winston.transports.DailyRotateFile = require('winston-daily-rotate-file');
winston.level = 'silly';

var timestamp = function(){
    return moment().format('hh:mm:ss.SSS');
};

var keywordSchema = new mongoose.Schema( {
    id: String,
    keywords: String,
    stopwords: String,
    price: Number
} );

var Keyword = mongoose.model('Keyword', keywordSchema, 'Keywords');

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
        if ( !totalCount ) {
            res.send( response.body );
            return;
        }
        max = Math.ceil( totalCount/100 );
        console.log( totalCount );
        // 2540 , 26번 요청 되어야함
        // 45 , 5번
        options.qs.display = 100;

        if ( max > 10 ) {
            max = 11;
        }
        iterationCount = max;
        for( i = 1;  i <= max; i += 1 ) {
            if ( i !== 1 ) {
                options.qs.start =  ( i - 1 ) * 100;
            }
            request( options, function( err, response, body ) {
                var responseData = {};
                var filterItem = [];
                if ( error ) {
                    return console.error('fail', error);
                }
                iterationCount--;
                responseData = JSON.parse( response.body );
                filterItem = responseData.items.filter( function( v ){
                    return ( v.productType === "1" || v.productType === "2" || v.productType === "3" );
                } );
                responseDataItem = responseDataItem.concat( responseData.items );
                if ( iterationCount === 0 ) {
                    console.log( "success" );
                    responseData.items = responseDataItem;
                    console.log( options );
                    res.send( responseData );
                }
            } );

        }
    });
} );



function sendMessage( id, message ){
    var cmd = 'python /root/I.jarang.u-be/telegram/sendmsg.py';
    exec( cmd + " " + id + " " + message.replace( /\ /g, "\\ " ), function(error, stdout, stderr) {
        console.log( stdout );
        res.send( "success" );
    } );
}


app.get( '/subscribe', function( req, res ){
    //./sendmsg.py 68399557 hi
    var id = req.query.id;
    var keyword = req.query.keyword;
    var except = req.query.except;
    var price = req.query.price;

    console.log( id, keyword, except, price )

    var keywordDB = new Keyword({
        id: id,
        keywords: encodeURIComponent( keyword ), //아이폰 7 블랙 : url인코딩 해서
        stopwords: except, //배터리 케이스 : 구분자 space utf-8
        price: price// 그냥 INT
    });

    keywordDB.save(function( err ){
        if( err ){
            logger.info('User: DB Save Error' + err );
        } else {
            logger.info( 'User save' );
            sendMessage( id, keyword + "가 성공적으로 등록되었습니다." );
        }
    });
} );



app.get('/', function (req, res) {
  res.send('Hello World!')
});
console.log('Example app listening on port 3000!')
app.listen( 3000 );
