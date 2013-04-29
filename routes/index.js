var User = require('../models/user.js');

// var ses = require('node-ses')
//   , client = ses.createClient({ key: 'key', secret: 'secret' });

var SendGrid = require('sendgrid').SendGrid
  , sendgrid = new SendGrid(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var jade = require('jade')
  , fs = require('fs');

exports.index = function(req, res){
  res.render('index');
};

exports.post = function(req, res) {
  req.assert('email', 'Email required.').notEmpty();
  req.assert('email', 'Valid email required.').isEmail();

  req.assert('username', 'Username required.').notEmpty();
  req.assert('username', 'Valid username required.').is(/^[A-Za-z\d-\_]+$/);

  var errors = req.validationErrors();
  if (errors) {
    res.render('index', { errors: errors });
  } else {
    var user = new User({
      username: req.body.username.toLowerCase(),
      fullUsername: req.body.username,
      email: req.body.email
    });
    user.save();

    fs.readFile('./templates/confirm.jade', 'utf8', function (err, data) {
      if (err) console.log(err);
      var fn = jade.compile(data);
      var message = fn({ username: req.body.username, userId: user._id });

      // client.sendemail({
      //   to: req.body.email,
      //   from: 'hello@hnmention.com',
      //   subject: 'Please confirm your email from HNMention',
      //   message: html
      // });
      sendgrid.send({
        to: req.body.email,
        from: 'hello@hnmention.com',
        subject: 'Please confirm your email on HNMention',
        html: message
      });
    });

    res.render('index', { notice: "Your form has been submitted. Check your email for confirmation." });
  }
};

exports.confirm = function(req, res) {
  User.findByIdAndUpdate(req.params.id, { subscribed: true }, function(err, saved) {
    if (err) { console.log(err) };
    res.render('index', { notice: "Your email has been confirmed." });
  });
}

exports.unsubscribe = function(req, res) {
  User.findByIdAndUpdate(req.params.id, { subscribed: false }, function(err, saved) {
    if (err) { console.log(err) };
    res.render('index', { notice: "Your email have been unsubscribed from HNMention." });
  });
}
