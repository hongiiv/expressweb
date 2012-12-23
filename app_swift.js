/** * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , sys = require('util')
  , url = require('url')
  , zlib = require('zlib')
  , JSONStream = require('JSONStream')
  , fs = require('fs')

var isRange ;
var isBam;
var range;
var isKill = 'False';
var passport = require('passport')
var BasicStrategy = require('passport-http').BasicStrategy

passport.use(new BasicStrategy(
  function(username, password, done) {
    if (username.valueOf() === 'guest' &&
      password.valueOf() === 'password')
      return done(null, true);
    else
      return done(null, false);
  }
));

var app = module.exports = express.createServer();

    var Swift = require('swift');
    var swift = new Swift({
        user: 'choihankyu@kt.com'
      , pass: 'MTMwOTg0NTI2OTEzMDk4NDQ0MzE2MjM0'
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
  app.use(passport.initialize());
  app.use(passport.session());
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

///
  if (isRange == 'True'){
     options.headers['range'] = range;
     options.headers['connection'] = 'keep-alive';
  }
///

  var client = https.request(options, function(res) {

    var buffers = [];
    if (pipe) {
      pipe.header('Content-Length', res.headers['content-length']);
      pipe.header('Content-Type', res.headers['content-type']);
      pipe.header('range', res.headers['range']);
      pipe.header('connection', res.headers['connection']);
    }


    console.log('****************');
    console.log(options.headers);
    console.log(options.path);
    console.log('****************');

    console.log(isKill);
    console.log(isRange);
    console.log(isBam);

    res.on('data', function(buffer) {
      if (pipe) {
        if (isRange == 'False' & isBam == 'True'){
           res.destroy();
        }else{
           console.log('#');
           pipe.write(buffer);
        }

      }else{
        buffers.push(buffer);
      }
    });


    res.on('end', function(err){
         buffers.length && clog.info(res.statusCode, res.headers);
         res.body = buffers.join('');
         callback && callback(null, res);
    });
  });


  client.on('error', function(err) {
    callback && callback(err);
    client.end(err);
  });
 
  client.end();
}


////

function extend(destination, source) {
  for (var property in source)
    destination[property] = source[property];
  return destination;
}

//app.get('/yours/:container/:object', function(req, res){
//app.get('/genomecloud/yourid/:object', function(req, res){
app.get('/genomecloud/yourid/:object', passport.authenticate('basic', { session: false }), function(req, res){


    //var container = req.params.container
    //, object = req.params.object;
    var container = 'M_RESULT';
    var object = req.params.object;
   

    console.log(req.headers);
    console.log(req.url);
    console.log('++++++++++++++++++++++');
    var file_url = req.url.toString();
    var file_split = file_url.split('\/');
    var file_name = file_split[3].toString();
    var ext_name = file_name.split('.');
    console.log(file_name);
    //console.log(ext_name.length);

    if(ext_name.length == 2) {
       console.log('bam');
       isBam = 'True';
       
    }else if(ext_name.length == 3) {
       var foo = ext_name.toString().split(',');
       isKill = 'False';
       for (i = 0 ; i < foo.length; i++){
          if (foo[i] == 'tdf'){
             isKill = 'True';
             console.log(foo[i]);
             res.destroy();
          }else{
             isKill = 'False';
          }
       }

       console.log('not bam');
       isBam = 'False';
    }
    console.log('++++++++++++++++++++++');
    
    //var ext_name = file_name.split('.')[1];
    //console.log(file_url.split('\/').length);
    //console.log(ext_name)
    

    if (req.headers['range']){
       isRange = 'True';
       range = req.headers['range'];
       console.log(range);

    }else{
       isRange = 'False';
    }
  
    request.call(swift, {
      path: '/v1/' + swift.account + '/' + container + '/' + object
    }, function(result, headers) {
      res.end()
      console.log('response end')
    }, res);


});

app.get('/account', function(req, res){
   swift.listContainers( function(result, headers){ 
         var clist=headers.body
         res.render('layout.jade',{
            locals: {
              title:'Containers list',
              body: clist
            }
         }); 
         //console.log(clist); 
   });
   //console.log('response end :)')
   //res.end();
});

app.get('/account/list/:container', function(req, res){
   var container=req.params.container;
   swift.listObjects( container, function(result, headers){
         var clist=headers.body
         res.render('layout.jade',{
            locals: {
              title:'Containers list',
              body: clist
            }
         });
         //console.log(clist);
   });
   //console.log('response end :)')
   //res.end();
});

app.get('/hello/:username',function(req,res) {
  var username = req.params.username;

  res.render('index.jade',{
    locals: {
      title:username,
      message:'message'
    }
  });
});

app.listen(3000);
//console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
