var User = require('../models/user.js');

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
    new User({username: req.body.username.toLowerCase(), email: req.body.email}).save();
    res.render('index', { notice: "Your form has been submitted. Check your email for confirmation." });
  }
};

