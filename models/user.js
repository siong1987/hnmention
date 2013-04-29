var mongoose = require('mongoose')
   , Schema = mongoose.Schema;
 
var userSchema = new Schema({
  username: { type: String },
  email: { type: String },
  subscribed: { type: Boolean, default: false }
});

userSchema.index({ username: 1, email: 1 }, { unique: true });
module.exports = mongoose.model('User', userSchema);
