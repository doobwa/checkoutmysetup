require('./db_connect')

var RequestSchema = new Schema({
  email : String,
  coupon : String
});

var exports = module.exports = mongoose.model('Request', RequestSchema);

