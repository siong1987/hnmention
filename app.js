
/**
 * Module dependencies.
 */

var express = require('express')
  , expressValidator = require('express-validator')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , cronJob = require('cron').CronJob;

var commentsProcessor = new cronJob({
  cronTime: '00 */5 * * * *',
  onTick: function() {
    var dd = new Date();
    var hh = dd.getHours();
    var mm = dd.getMinutes();
    var ss = dd.getSeconds();
    console.log("The time is now: " + hh + ":" + mm + ":" + ss);
  }
});
commentsProcessor.start();

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

app.configure('development', function(){
  app.use(express.errorHandler());
});

var csrf = function(req, res, next) {
  res.locals.token = req.session._csrf;
  next();
}

app.get('/', csrf, routes.index);

app.post('/', csrf, function(req, res) {
  req.assert('email', 'Email required.').notEmpty();
  req.assert('email', 'Valid email required.').isEmail();

  req.assert('username', 'Username required.').notEmpty();
  req.assert('username', 'Valid username required.').is(/^[A-Za-z\d-\_]+$/);

  var errors = req.validationErrors();
  if (errors) {
    res.render('index', { errors: errors });
  } else {
    res.render('index', { notice: "Your form has been submitted. Check your email for confirmation." });
  }
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
