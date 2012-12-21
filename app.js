var express = require('express')
  , routes = require('./routes')
  , sys = require('util')
  , url = require('url')
  , zlib = require('zlib')
  , JSONStream = require('JSONStream')
  , fs = require('fs')

var app = module.exports = express.createServer();

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.logger());
  app.use(express.errorHandler());
});

// Routes

app.get('/TGP2011D0013.bam',function(request,response) {

    var filename = "TGP2011D0013.bam";
var fileLength = fs.statSync(filename).size;


var resHeaders = {
'Content-Type' : 'text/plain',
'Content-Length' : fileLength,
'Accept-Ranges' : 'bytes',
'Last-Modified' : 'Fri, 20 Jul 2012 13:22:18 GMT',
'ETag' : '738007-290939a73f-4c542c9067680',
'Keep-Alive' : 'timeout=15, max=99',
'Connection' : 'Keep-Alive',
};

var resHeaders2 = {
'content-type' : 'application/octet',
'content-length' : fileLength,
'accept-ranges' : 'bytes',
'Last-Modified' : 'Fri, 20 Jul 2012 13:22:18 GMT',
'ETag' : '738007-290939a73f-4c542c9067680',
'Keep-Alive' : 'timeout=15, max=99',
'Connection' : 'Keep-Alive'
};

var code=200;

if (request.headers['range']) {	
console.log('>>>>>>>>>>>>>>>');
console.log(request);

var value = request.headers['range'].split('=')[1].split('-');
var start = Number(value[0] || 0);
var end = Number(value[1] || fileLength);
resHeaders2['Accept-Ranges'] = 'bytes';
resHeaders2['Content-Length'] = end - start +1;
resHeaders2['Content-Range'] = 'bytes '+start+'-'+end+'/'+fileLength;
code = 206;
console.log('>>>>>>>>>>>>>>>');

var MAX = 5500 * 1024; // bytes in a second
response.writeHead(code, resHeaders2);
console.log(resHeaders2);

response.on('pipe', function(source) {
if (!MAX) return false;
var START = Date.parse(new Date()); 
var TOTAL = 0;
source.on('data', function(data) {
TOTAL += data.length;
var duration = Date.parse(new Date()) - START;
if ((TOTAL/(duration||1))*1000 > MAX) {
source.pause();
setTimeout(
function(){source.resume()}, 
Math.ceil((TOTAL*1000)/MAX-duration)
);
}
});
});

fs.createReadStream(filename, {start:start, end: end}).pipe(response);	

}else{

console.log(resHeaders);
var code = 200;
    response.writeHead(code, resHeaders);
    response.destroy();

}

});

app.get('/TGP2011D0013.bam.bai',function(request,response) {

    var filename = "TGP2011D0013.bam.bai";

var fileLength = fs.statSync(filename).size;
var resHeaders = {
'content-type' : 'application/octet',
'content-length' : fileLength,
'accept-ranges' : 'bytes'
};
var code = 200;
if (request.headers['range']) {	
var value = request.headers['range'].split('=')[1].split('-'); 
var start = Number(value[0] || 0);
var end = Number(value[1] || fileLength);
resHeaders['accept-ranges'] = 'bytes';
resHeaders['content-length'] = end - start; 
resHeaders['content-range'] = 'bytes '+start+'-'+end+'/'+fileLength;
code = 206;
console.log(resHeaders);
};
var MAX = 5500 * 1024; // bytes in a second
    response.writeHead(code, resHeaders);
response.on('pipe', function(source) {
if (!MAX) return false;
var START = Date.parse(new Date()); 
var TOTAL = 0;
source.on('data', function(data) {
TOTAL += data.length;
var duration = Date.parse(new Date()) - START;
if ((TOTAL/(duration||1))*1000 > MAX) {
source.pause();
setTimeout(
function(){source.resume()}, 
Math.ceil((TOTAL*1000)/MAX-duration)
);
}
});
});
    fs.createReadStream(filename, {start:start, end: end}).pipe(response);	
 
});

app.listen(3000);
