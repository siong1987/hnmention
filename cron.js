var cronJob = require('cron').CronJob
  , request = require('request');

var SendGrid = require('sendgrid').SendGrid
  , sendgrid = new SendGrid(process.env.SENDGRID_USERNAME, process.env.SENDGRID_PASSWORD);

var jade = require('jade')
  , fs = require('fs');

var User = require('./models/user.js')
  , Comment = require('./models/comment.js');

var notifyUser = function(username, comment) {
  User.find({ username: username }, function (err, users) {
    if (err) { console.log(err) };
    users.forEach(function(user) {
      if (user.subscribed) {
        fs.readFile('./templates/notify.jade', 'utf8', function (err, data) {
          if (err) console.log(err);
          var fn = jade.compile(data);
          var message = fn({ comment: comment, user: user });

          sendgrid.send({
            to: user.email,
            from: 'hello@hnmention.com',
            subject: 'Someone mentions you on Hacker News',
            html: message
          });
        });
      }
    });

    return;
  });
}

var processComment = function(comment, mentions) {
  Comment.findOne({ 'commentId': parseInt(comment.id) }, function (err, c) {
    if (err) { console.log(err) };
    if (!c) {
      new Comment({username: comment.user.toLowerCase(), content: comment.content, commentId: parseInt(comment.id), mentions: mentions}).save();

      mentions.forEach(function(mention) {
        notifyUser(mention.substring(1, mention.length).toLowerCase(), comment);
      });
    }
  });
}

var processComments = function(comments) {
  comments.forEach(function(comment) {
    var mentions = comment.content.match(/@([\w-]+)/gm);

    if (mentions && mentions.length !== 0) {
      processComment(comment, mentions);
    }
  });
}

exports.commentsProcessor = new cronJob({
  cronTime: '00 */5 * * * *',
  onTick: function() {
    request('http://node-hnapi.herokuapp.com/newcomments', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var comments = JSON.parse(body);
        processComments(comments);
      };
    });
  }
});

// To make sure that heroku won't shut down the server.
exports.pingOwn = new cronJob({
  cronTime: '00 */1 * * * *',
  onTick: function() {
    request('http://www.hnmention.com/', function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log("Pinging own server...");
      };
    });
  }
});
