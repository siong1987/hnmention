
/**
 * Module dependencies.
 */

var express = require('express')
  , cluster = require('cluster')
  , expressValidator = require('express-validator')
  , mongoose = require('mongoose')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , cron = require('./cron');

if ( cluster.isMaster ) {
  // start the cron job.
  cron.commentsProcessor.start();
  cron.pingOwn.start();

  for ( var i = 0; i < 4; i++ )
    cluster.fork();
} else {
  var mongo = process.env.MONGOHQ_URL || 'mongodb://localhost/hnmention';
  mongoose.connect(mongo);

  var app = express();

  app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'crazy session key' }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(expressValidator);
    app.use(app.router);
    app.use(express.csrf());
    app.use(express.static(path.join(__dirname, 'public')));
  });

  app.configure('development', function() {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.configure('production', function() {
    app.use(express.errorHandler());
  });

  var csrf = function(req, res, next) {
    res.locals.token = req.session._csrf;
    next();
  }

  app.get('/', csrf, routes.index);
  app.get('/confirm/:id', csrf, routes.confirm);
  app.get('/unsubscribe/:id', csrf, routes.unsubscribe);
  app.post('/', csrf, routes.post);

  var port = process.env.PORT || 3000;
  http.createServer(app).listen(port, function(){
    console.log("Express server listening on port " + app.get('port'));
  });
}
