require('./db_connect')

var RequestSchema = new Schema({
  email : String,
  coupon : String,
  created_at  : {type : Date, default : Date.now},
});

var exports = module.exports = mongoose.model('Request', RequestSchema);

