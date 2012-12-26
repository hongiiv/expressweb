/** * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sys = require('util')
  , url = require('url')
  , zlib = require('zlib')
  , JSONStream = require('JSONStream')
  , fs = require('fs')
  , crypto = require('crypto')
  , clog = require('clog')
  , wrap = require('wrap')
  , MultipartParser = require('multipart').MultipartParser;

var isRange ;
var isBam;
var range;
var isKill = 'False';

var app = module.exports = express.createServer();

    var Swift = require('swift');
    var swift = new Swift({
        user: ''
      , pass: ''
      , host: 'ssproxy.ucloudbiz.olleh.com'
      , port: 443
    }, function(err, res) {
      if (!swift.account && !swift.token)
        // error
        sys.debug("error")
    });
    
// Configuration

app.configure(function(){
  app.use(express.cookieParser());
  app.use(express.session({secret:'123abc',key:'express.sid'}));
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(express.logger());
});

app.configure('production', function(){
  app.use(express.logger());
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

// Routes for swift
var https = require('https')

function extend(destination, source) {
  //console.log(">>>>>>>>>>>>>>>>extend start<<<<<<<<<<<<<<<")
  for (var property in source)
    destination[property] = source[property];
    //console.log(source[property])
  //console.log(destination)
  //console.log(">>>>>>>>>>>>>>>>extend end<<<<<<<<<<<<<<<")
  return destination;
}

function request(options, callback, pipe) {
  options = extend({
      host: this.options.host
    , port: this.options.port
    , path: '/auth/v1.0'
    , method: 'GET'
    , headers: {
        'X-Auth-Token': this.token
      , 'X-Storage-Token': this.token
    }
  }, options);

  options.headers['User-Agent'] = 'Node.JS Swift API Client';
  options.path = encodeURI(options.path);
  

  var client = https.request(options, function(res) {
    var buffers = [];
    if (pipe && pipe.res) {
      pipe.res.header('Content-Length', res.headers['content-length']);
      pipe.res.header('Content-Type', res.headers['content-type']);
    }


    console.log('****************');
    console.log(options);
    console.log(options.path);
    console.log('****************');

    if (!pipe || pipe.res) {
      console.log('--------------------------');
      res.on('data', function(buffer) {
        if (pipe && pipe.res) pipe.res.write(buffer);
        else buffers.push(buffer);
      });
  
      res.on('end', function(err){
        res.body = buffers.join('');
        callback && callback(err, res);
      });
    }

    res.on('end', function(err){
      clog.info(res.statusCode, options.path, res.headers);
      clog.info(res.statusCode);
      res.body = buffers.join('');
      callback && callback(null, res);
      if (res.statusCode >= 400) {
        callback && callback({
          statusCode: res.statusCode,
          body: buffers.toString()
        });
      }
    });
  });

  client.on('error', function(err) {
    callback && callback(err);
    client.end();
  });
  

  if (!pipe || pipe.res) return client.end();

  var bytesReceived = 0
  //  , contentLength = 76
    , parser = options.boundary ? multipart(extend(options, {
      onHeadersEnd: function(part) {
        options.contentLength -= contentLength + options.boundary.length * 2 + part.name.length + part.filename.length + part.mime.length + 8;
      },
      onPartData: function(buffer) {
        client.write(buffer);
      }
    })) : null;

  pipe.req.on('data', function(buffer) {
    parser ? parser.write(buffer) : client.write(buffer);
    //console.log(buffer);
    pipe.req.emit('progress', bytesReceived += buffer.length, options.contentLength || options.headers['Content-Length']);
    clog.info(bytesReceived);
  });

  pipe.req.on('end', function() {
    client.end();
    clog.info('pipe.req.on eeeeeeeend');
    //callback && callback();
    callback;
  });
}

function fileName(headerValue) {
  var m = headerValue.match(/filename="(.*?)"($|; )/i)
  if (!m) return;

  var filename = m[1].substr(m[1].lastIndexOf('\\') + 1);
  filename = filename.replace(/%22/g, '"');
  filename = filename.replace(/&#([\d]{4});/g, function(m, code) {
    return String.fromCharCode(code);
  });

  return filename;
}

function multipart(options) {
  var parser = new MultipartParser()
    , headerField
    , headerValue
    , part = {};

  parser.initWithBoundary(options.boundary);

  parser.onPartBegin = function() {
    part.headers = {};
    part.name = null;
    part.filename = null;
    part.mime = null;
    headerField = '';
    headerValue = '';
  };

  parser.onHeaderField = function(b, start, end) {
    headerField += b.toString(options.encoding, start, end);
  };

  parser.onHeaderValue = function(b, start, end) {
    headerValue += b.toString(options.encoding, start, end);
  };

  parser.onHeaderEnd = function() {
    headerField = headerField.toLowerCase();
    part.headers[headerField] = headerValue;

    var name = headerValue.match(/name="([^"]+)"/i);
    if (headerField == 'content-disposition') {
      if (name) part.name = name[1];
      part.filename = fileName(headerValue);
    } else if (headerField == 'content-type') {
      part.mime = headerValue;
    }

    headerField = '';
    headerValue = '';
  };

  parser.onHeadersEnd = function() {
    options.onHeadersEnd && options.onHeadersEnd(part);
  };

  parser.onPartData = function(b, start, end) {
    options.onPartData && options.onPartData(b.slice(start, end));
  };

  return parser;
}

function extend(destination, source) {
  //console.log(">>>>>>>>>>>>>>>>extend start<<<<<<<<<<<<<<<")
  for (var property in source)
    destination[property] = source[property];
    //console.log(source[property])
  //console.log(destination)
  //console.log(">>>>>>>>>>>>>>>>extend end<<<<<<<<<<<<<<<")
  return destination;
}

app.put('/upload/:object', function(req, res){


    console.log('----------------------');
    console.log(req.headers);
    console.log(req.url);
    console.log('----------------------');
    console.log();

    var container = 'test01';
    var object = req.params.object;

    var options = {
      path: '/v1/' + swift.account + '/' + container + '/' + object
    , method: 'PUT'
    , filename: object
    , headers: {
        'X-Auth-Token': swift.token
      //, 'Content-Type': req.headers['content-type']
      //, 'ETag': crypto.createHash('md5').update(container + '/' + object).digest('hex')
      //, 'X-Object-Meta-PIN': 1234
    }
  };


  console.log();
  console.log(swift);
  console.log();

  if (req.xhr) {
    console.log('req.xhr >>>>>>>>>');
    options.headers['Content-Length'] = req.headers['content-length'];
  } else {
    //var boundary = req.headers['content-type'].match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    extend(options, {
        contentLength: req.headers['content-length']
      , encoding: 'utf-8'
     // , boundary: boundary[1] || boundary[2]
    });
    options.headers['Transfer-Encoding'] = 'chunked';
  }

  request.call(swift, options, function(result, headers) {
      res.end()
      console.log('response end')
    }, {req: req});

});


app.listen(3000);
//console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
