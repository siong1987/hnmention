var mongoose = require('mongoose')
   , Schema = mongoose.Schema;
 
var commentSchema = new Schema({
  username: { type: String },
  content: { type: String },
  commentId: { type: Number },
  mentions: { type: Array }
});

commentSchema.index({ commentId: 1 }, { unique: true });
module.exports = mongoose.model('Comment', commentSchema);
