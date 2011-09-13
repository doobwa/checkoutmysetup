//require('./db_connect')
mongoose = require('mongoose');
var MarkerSchema = new Schema({
    description     : String,
    x      : String,
    y      : String
});

var SetupSchema = new Schema({
  title: String,
  url: String,
  description: String,
  user_id : String,
  markers  : [MarkerSchema],
  created_at  : {type : Date, default : Date.now},
  updated_at  : {type : Date, default : Date.now}
});

var exports = module.exports = mongoose.model('Setup', SetupSchema);
