//require('./db_connect')
mongoose = require('mongoose');
var MarkerSchema = new Schema({
    description     : String
  , x      : String
  , y      : String
});

var SetupSchema = new Schema({
  title: String,
  url: String,
  description: String,
  user_id : String,
  markers  : [MarkerSchema]
});

var exports = module.exports = mongoose.model('Setup', SetupSchema);
